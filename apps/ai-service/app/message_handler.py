"""
WhatsApp message dispatcher — multi-tenant edition.

Routes each incoming message to the correct tenant's Gemini agent based on
the Twilio number that received the message (to_number).
"""

from __future__ import annotations

import asyncio
import logging
import os

from app.agent import run
from app.admin_agent import run_admin
from app.backend_client import get_client
from app.config import get_tenant_config
from app.redis_store import delete_session, load_session, save_session

logger = logging.getLogger(__name__)

# In-memory cache for active sessions within a single process lifetime.
# Redis is used as the persistent backing store; this dict avoids redundant
# Redis reads for the same conversation within the same deployment instance.
_sessions: dict[str, dict] = {}

_RESET_COMMANDS = {
    "menu", "inicio", "reiniciar", "reset",
    "nueva conversacion", "nueva conversación",
}


def _session_key(to_number: str, phone: str) -> str:
    return f"{to_number}:{phone}"


async def _get_or_load_session(to_number: str, phone: str) -> tuple[dict, bool]:
    """
    Return (session, is_new) — loading from Redis if not in local cache.
    is_new=True means this is the first message after a restart or new conversation.
    """
    key = _session_key(to_number, phone)
    if key in _sessions:
        return _sessions[key], False

    # Try Redis first
    stored = await load_session(key)
    _sessions[key] = stored
    return stored, True


async def handle_message(
    phone: str,
    text: str,
    to_number: str = "default",
    media_url: str | None = None,
) -> str:
    """
    Process one incoming WhatsApp message.

    Args:
        phone:     Twilio From value (e.g. 'whatsapp:+521234567890').
        text:      Message body.
        to_number: Twilio number that received the message (e.g. '+15551234567').
                   Used to look up the correct tenant. Defaults to "default"
                   for legacy single-tenant deployments.
        media_url: Twilio MediaUrl0 if the message includes an image (or None).
    """
    # ── Tenant lookup ─────────────────────────────────────────────────────────
    config = get_tenant_config(to_number)
    if config is None:
        logger.warning("No tenant configured for to_number=%s", to_number)
        return (
            "Lo sentimos, este número no tiene un servicio activo configurado. "
            "Contacta al administrador."
        )

    # ── Opt-out (STOP) ────────────────────────────────────────────────────────
    if text.strip().upper() in ("STOP", "DETENER", "CANCELAR", "UNSUB", "BAJA"):
        clean_phone_stop = phone.replace("whatsapp:", "").strip()
        backend_client_stop = get_client(config.bot_email, config.bot_password)
        try:
            await backend_client_stop.marcar_desuscrito(clean_phone_stop)
        except Exception as exc:
            logger.warning("Could not mark unsubscribed for %s: %s", phone, exc)
        return (
            "Has sido eliminado de nuestra lista de mensajes. "
            "Si cambias de opinión, escríbenos y con gusto te atendemos. 👋"
        )

    # ── Reset command ─────────────────────────────────────────────────────────
    if text.lower().strip() in _RESET_COMMANDS:
        key = _session_key(to_number, phone)
        _sessions.pop(key, None)
        await delete_session(key)
        logger.info("Session reset for %s on %s", phone, to_number)
        reset_reply = "¡Conversación reiniciada! 🔄\n¿En qué puedo ayudarte hoy?"
        clean_phone_reset = phone.replace("whatsapp:", "").strip()
        backend_client_reset = get_client(config.bot_email, config.bot_password)
        asyncio.create_task(backend_client_reset.ingest_message(clean_phone_reset, text, "INBOUND"))
        asyncio.create_task(backend_client_reset.ingest_message(clean_phone_reset, reset_reply, "OUTBOUND"))
        return reset_reply

    # ── Owner phone per tenant ────────────────────────────────────────────────
    safe_number = to_number.replace("+", "")
    owner_phone = os.getenv(f"OWNER_PHONE_{safe_number}", os.getenv("OWNER_PHONE", ""))

    # ── Backend client + session ──────────────────────────────────────────────
    backend_client = get_client(config.bot_email, config.bot_password)
    key = _session_key(to_number, phone)
    session, is_new_session = await _get_or_load_session(to_number, phone)

    clean_phone = phone.replace("whatsapp:", "").strip()

    # Restore context from DB if this is a new session and Redis had no history.
    # Stored under "restored_context" so it does not conflict with Gemini Content objects.
    if is_new_session and not session.get("restored_context") and not session.get("history"):
        try:
            history = await backend_client.get_sesion(clean_phone)
            if history:
                session["restored_context"] = history
                logger.info(
                    "Restored %d messages from backend for %s on %s",
                    len(history), phone, to_number,
                )
        except Exception as exc:
            logger.warning("Failed to restore session for %s: %s", phone, exc)

    # Registrar mensaje entrante (fire-and-forget)
    asyncio.create_task(
        backend_client.ingest_message(clean_phone, text, "INBOUND")
    )

    # ── Admin detection ───────────────────────────────────────────────────────
    admin_info = await backend_client.check_admin(clean_phone)

    if admin_info.get("isAdmin"):
        admin_session: list = session.setdefault("admin_history", [])
        try:
            reply = await run_admin(
                phone,
                text,
                media_url,
                admin_session,
                backend_client,
                owner_phone,
                admin_info,
            )
        except Exception as exc:
            logger.error(
                "Admin agent error for %s on %s: %s", phone, to_number, exc, exc_info=True
            )
            reply = (
                "⚠️ Ocurrió un error inesperado en el modo admin. "
                "Por favor intenta de nuevo en unos momentos."
            )
    else:
        # ── Plan enforcement ──────────────────────────────────────────────────
        track = await backend_client.track_conversation(clean_phone)
        if not track.get("allowed", True):
            plan = track.get("plan", "STARTER")
            used = track.get("used", 0)
            limit = track.get("limit", 500)
            logger.info(
                "Plan limit reached for tenant on %s — plan=%s used=%s limit=%s",
                to_number, plan, used, limit,
            )
            frontend_url = os.getenv("FRONTEND_URL", "https://automatiza360.vercel.app")
            return (
                f"Hola 👋 Hemos alcanzado el límite de conversaciones de este mes "
                f"({used}/{limit} en plan {plan}).\n\n"
                f"Para seguir atendiendo sin interrupciones, el negocio puede actualizar "
                f"su plan en: {frontend_url}/mi-plan\n\n"
                "Gracias por tu paciencia 🙏"
            )
        try:
            reply = await run(phone, text, session, backend_client, owner_phone)
        except Exception as exc:
            logger.error(
                "Agent error for %s on %s: %s", phone, to_number, exc, exc_info=True
            )
            return (
                "⚠️ Ocurrió un error inesperado. "
                "Por favor intenta de nuevo en unos momentos."
            )

    # Registrar respuesta del bot (fire-and-forget)
    asyncio.create_task(
        backend_client.ingest_message(clean_phone, reply, "OUTBOUND")
    )

    # Persist updated session to Redis (fire-and-forget to avoid blocking the reply)
    asyncio.create_task(save_session(key, session))

    return reply
