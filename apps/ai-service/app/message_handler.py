"""
WhatsApp message dispatcher.

Delegates every incoming message to the Gemini agent and manages
per-phone conversation sessions (in-memory).
"""

from __future__ import annotations

import logging

from app.agent import run

logger = logging.getLogger(__name__)

# In-memory sessions keyed by Twilio "From" value (e.g. "whatsapp:+521234567890").
# Each session is a dict with at least {"history": [...]}.
_sessions: dict[str, dict] = {}

_RESET_COMMANDS = {"menu", "inicio", "reiniciar", "reset", "nueva conversacion", "nueva conversación"}


def _get_session(phone: str) -> dict:
    if phone not in _sessions:
        _sessions[phone] = {}
    return _sessions[phone]


async def handle_message(phone: str, text: str) -> str:
    if text.lower().strip() in _RESET_COMMANDS:
        _sessions.pop(phone, None)
        logger.info("Session reset for %s", phone)
        return (
            "¡Conversación reiniciada! 🔄\n"
            "¿En qué puedo ayudarte hoy?"
        )

    session = _get_session(phone)

    try:
        return await run(phone, text, session)
    except Exception as exc:
        logger.error("Agent error for %s: %s", phone, exc, exc_info=True)
        return (
            "⚠️ Ocurrió un error inesperado. "
            "Por favor intenta de nuevo en unos momentos."
        )
