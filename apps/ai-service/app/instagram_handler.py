"""
Instagram DM handler.

Receives webhook events from Meta, extracts DM text/media, routes to the
same Gemini customer agent used for WhatsApp, and sends the reply back via
the Meta Graph API.

Webhook entry format (Instagram Messaging):
{
  "object": "instagram",
  "entry": [{
    "id": "<PAGE_ID>",
    "messaging": [{
      "sender":    {"id": "<PSID>"},
      "recipient": {"id": "<PAGE_ID>"},
      "message": {
        "text": "...",
        "attachments": [{"type": "image", "payload": {"url": "..."}}]
      }
    }]
  }]
}
"""

from __future__ import annotations

import asyncio
import logging
import os

from app.agent import run
from app.backend_client import get_client
from app.config import get_tenant_by_instagram_page
from app.meta_client import send_instagram_message
from app.redis_store import load_session, save_session

logger = logging.getLogger(__name__)

# In-memory session cache — same pattern as WhatsApp handler
_ig_sessions: dict[str, dict] = {}


def _session_key(page_id: str, psid: str) -> str:
    return f"instagram:{page_id}:{psid}"


async def handle_instagram_event(payload: dict) -> None:
    """
    Process one Instagram webhook POST payload (fire-and-forget friendly).
    Iterates over all entries and messaging events in the payload.
    """
    entries = payload.get("entry", [])
    for entry in entries:
        page_id: str = entry.get("id", "")
        for event in entry.get("messaging", []):
            # Skip echo messages (our own outgoing messages reflected back)
            if event.get("message", {}).get("is_echo"):
                continue
            # Skip delivery / read receipts
            if "delivery" in event or "read" in event:
                continue

            sender_id: str = event.get("sender", {}).get("id", "")
            if not sender_id or sender_id == page_id:
                continue

            msg = event.get("message", {})
            text: str = msg.get("text", "").strip()

            # Extract image URL if present (first attachment)
            media_url: str | None = None
            for att in msg.get("attachments", []):
                if att.get("type") in ("image", "video"):
                    media_url = att.get("payload", {}).get("url")
                    break

            if not text and not media_url:
                continue

            asyncio.create_task(
                _process_instagram_message(page_id, sender_id, text, media_url)
            )


async def _process_instagram_message(
    page_id: str,
    psid: str,
    text: str,
    media_url: str | None,
) -> None:
    """Process a single Instagram DM and send the reply."""
    config = get_tenant_by_instagram_page(page_id)
    if config is None:
        logger.warning("No tenant configured for instagram page_id=%s", page_id)
        return

    if not config.meta_page_access_token:
        logger.error("Tenant %s has no meta_page_access_token", config.bot_email)
        return

    # Opt-out handling — same keywords as WhatsApp
    if text.upper() in ("STOP", "DETENER", "CANCELAR", "UNSUB", "BAJA"):
        await send_instagram_message(
            psid,
            "Has sido eliminado de nuestra lista de mensajes. "
            "Si cambias de opinión, escríbenos y con gusto te atendemos. 👋",
            config.meta_page_access_token,
        )
        return

    # Use psid as the "phone" identifier — works transparently with the existing agent
    fake_phone = f"instagram:{psid}"
    owner_phone = os.getenv("OWNER_PHONE", "")

    backend_client = get_client(config.bot_email, config.bot_password)
    key = _session_key(page_id, psid)

    # Load or create session
    if key not in _ig_sessions:
        stored = await load_session(key)
        _ig_sessions[key] = stored
    session = _ig_sessions[key]

    # Restore conversation context from backend on first contact
    if not session.get("restored_context") and not session.get("history"):
        try:
            history = await backend_client.get_sesion(psid)
            if history:
                session["restored_context"] = history
        except Exception:
            pass

    # Track inbound message in backend (fire-and-forget)
    asyncio.create_task(backend_client.ingest_message(psid, text or "[imagen]", "INBOUND"))

    # Build effective text (append image note if present)
    effective_text = text or "hola"
    if media_url:
        effective_text += f"\n[Imagen adjunta: {media_url}]"

    # Run the customer-facing Gemini agent (same as WhatsApp)
    try:
        reply = await run(fake_phone, effective_text, session, backend_client, owner_phone)
    except Exception as exc:
        logger.error("Instagram agent error psid=%s: %s", psid, exc, exc_info=True)
        reply = "⚠️ Ocurrió un error inesperado. Por favor intenta de nuevo."

    # Record outbound and persist session
    asyncio.create_task(backend_client.ingest_message(psid, reply, "OUTBOUND"))
    asyncio.create_task(save_session(key, session))

    # Send reply via Meta Graph API
    await send_instagram_message(psid, reply, config.meta_page_access_token)
