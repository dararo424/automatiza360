"""
WhatsApp message dispatcher — multi-tenant edition.

Routes each incoming message to the correct tenant's Gemini agent based on
the Twilio number that received the message (to_number).
"""

from __future__ import annotations

import logging
import os

from app.agent import run
from app.backend_client import get_client
from app.config import get_tenant_config

logger = logging.getLogger(__name__)

# Sessions keyed by "{to_number}:{from_phone}" so each tenant has isolated
# conversation history even if the same WhatsApp number messages both bots.
_sessions: dict[str, dict] = {}

_RESET_COMMANDS = {
    "menu", "inicio", "reiniciar", "reset",
    "nueva conversacion", "nueva conversación",
}


def _session_key(to_number: str, phone: str) -> str:
    return f"{to_number}:{phone}"


def _get_session(to_number: str, phone: str) -> dict:
    key = _session_key(to_number, phone)
    if key not in _sessions:
        _sessions[key] = {}
    return _sessions[key]


async def handle_message(phone: str, text: str, to_number: str = "default") -> str:
    """
    Process one incoming WhatsApp message.

    Args:
        phone:     Twilio From value (e.g. 'whatsapp:+521234567890').
        text:      Message body.
        to_number: Twilio number that received the message (e.g. '+15551234567').
                   Used to look up the correct tenant. Defaults to "default"
                   for legacy single-tenant deployments.
    """
    # ── Tenant lookup ─────────────────────────────────────────────────────────
    config = get_tenant_config(to_number)
    if config is None:
        logger.warning("No tenant configured for to_number=%s", to_number)
        return (
            "Lo sentimos, este número no tiene un servicio activo configurado. "
            "Contacta al administrador."
        )

    # ── Reset command ─────────────────────────────────────────────────────────
    if text.lower().strip() in _RESET_COMMANDS:
        key = _session_key(to_number, phone)
        _sessions.pop(key, None)
        logger.info("Session reset for %s on %s", phone, to_number)
        return "¡Conversación reiniciada! 🔄\n¿En qué puedo ayudarte hoy?"

    # ── Owner phone per tenant ────────────────────────────────────────────────
    # Lookup order:
    #   1. OWNER_PHONE_<digits-of-twilio-number>  e.g. OWNER_PHONE_15551234567
    #   2. OWNER_PHONE  (global fallback)
    safe_number = to_number.replace("+", "")
    owner_phone = os.getenv(f"OWNER_PHONE_{safe_number}", os.getenv("OWNER_PHONE", ""))

    # ── Backend client + session ──────────────────────────────────────────────
    backend_client = get_client(config.bot_email, config.bot_password)
    session = _get_session(to_number, phone)

    try:
        return await run(phone, text, session, backend_client, owner_phone)
    except Exception as exc:
        logger.error(
            "Agent error for %s on %s: %s", phone, to_number, exc, exc_info=True
        )
        return (
            "⚠️ Ocurrió un error inesperado. "
            "Por favor intenta de nuevo en unos momentos."
        )
