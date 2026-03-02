"""
Conversation state machine for the Automatiza360 WhatsApp bot.

States per user phone number:
  idle               → detect intent from free text
  ticket_search      → choose lookup method (by number or by phone)
  ticket_by_number   → waiting for the ticket number
  quote_name         → collecting client name for a new service request
  quote_device       → collecting device description
  quote_issue        → collecting problem description → creates Ticket
"""

from __future__ import annotations

import re
from app.backend_client import (
    buscar_tickets_por_telefono,
    buscar_ticket_por_numero,
    crear_ticket,
)

# In-memory sessions keyed by WhatsApp phone ("whatsapp:+521234567890").
# For multi-instance deployments, replace with Redis.
_sessions: dict[str, dict] = {}

# ── Constants ─────────────────────────────────────────────────────────────────

TICKET_STATUS: dict[str, str] = {
    "RECEIVED":      "📬 Recibido — en espera de diagnóstico.",
    "DIAGNOSING":    "🔍 En diagnóstico — analizando el problema.",
    "WAITING_PARTS": "🛒 Esperando repuestos — piezas en camino.",
    "REPAIRING":     "🔧 En reparación — trabajando en tu dispositivo.",
    "READY":         "✅ ¡Listo para retirar! Puedes pasar a buscarlo.",
    "DELIVERED":     "📦 Entregado.",
    "CANCELLED":     "❌ Cancelado.",
}

WELCOME = (
    "¡Hola! Soy el asistente de *Automatiza360* 🤖\n\n"
    "¿En qué te puedo ayudar?\n"
    "1️⃣  Consultar el *estado de mi reparación*\n"
    "2️⃣  Solicitar un *servicio o cotización*\n\n"
    "Escribe *1* o *2*, o descríbeme qué necesitas."
)

_TICKET_KEYWORDS = (
    "ticket", "reparaci", "equipo", "estado", "listo", "diagnósti",
    "cómo está", "como esta", "cuánto falta", "cuanto falta", "mi celular",
    "mi laptop", "mi pc", "mi computadora",
)

_QUOTE_KEYWORDS = (
    "cotizaci", "presupuesto", "cuánto cuesta", "cuanto cuesta",
    "precio", "cuánto cobran", "cuanto cobran", "quiero reparar",
    "necesito reparar", "pueden reparar",
)

# ── Session helpers ───────────────────────────────────────────────────────────

def _session(phone: str) -> dict:
    if phone not in _sessions:
        _sessions[phone] = {"state": "idle"}
    return _sessions[phone]


def _reset(phone: str) -> None:
    _sessions[phone] = {"state": "idle"}


# ── Formatting ────────────────────────────────────────────────────────────────

def _format_ticket(t: dict) -> str:
    status = TICKET_STATUS.get(t["status"], t["status"])
    lines = [
        f"*Ticket #{t['number']}*",
        f"Dispositivo: {t['device']}",
        f"Problema: {t['issue']}",
        f"Estado: {status}",
    ]
    if t.get("diagnosis"):
        lines.append(f"Diagnóstico: {t['diagnosis']}")
    if t.get("price") is not None:
        lines.append(f"Precio: ${t['price']:.2f}")
    return "\n".join(lines)


# ── Main entry point ──────────────────────────────────────────────────────────

async def handle_message(phone: str, text: str) -> str:
    sess = _session(phone)
    lower = text.lower()

    # Global reset commands
    if lower in ("menu", "inicio", "hola", "ayuda", "help", "cancelar", "salir"):
        _reset(phone)
        return WELCOME

    state = sess["state"]

    if state == "idle":
        return await _idle(phone, sess, text, lower)
    if state == "ticket_search":
        return await _ticket_search(phone, sess, text, lower)
    if state == "ticket_by_number":
        return await _ticket_by_number(phone, text)
    if state == "quote_name":
        return _quote_name(phone, sess, text)
    if state == "quote_device":
        return _quote_device(phone, sess, text)
    if state == "quote_issue":
        return await _quote_issue(phone, sess, text)

    _reset(phone)
    return WELCOME


# ── State handlers ────────────────────────────────────────────────────────────

async def _idle(phone: str, sess: dict, text: str, lower: str) -> str:
    wants_ticket = text == "1" or any(kw in lower for kw in _TICKET_KEYWORDS)
    wants_quote  = text == "2" or any(kw in lower for kw in _QUOTE_KEYWORDS)

    if wants_ticket:
        sess["state"] = "ticket_search"
        return (
            "Puedo buscar tu reparación de dos formas:\n"
            "1️⃣  Por *número de ticket* (ej: *42*)\n"
            "2️⃣  Por el *teléfono registrado* al dejar el equipo\n\n"
            "Escribe *1* o *2*."
        )

    if wants_quote:
        sess["state"] = "quote_name"
        return "¡Con gusto te ayudamos! ¿Cuál es tu *nombre completo*?"

    return WELCOME


async def _ticket_search(phone: str, sess: dict, text: str, lower: str) -> str:
    by_number = text == "1" or any(w in lower for w in ("número", "numero", "ticket", "folio"))
    by_phone  = text == "2" or any(w in lower for w in ("teléfono", "telefono", "celular", "número de tel"))

    if by_number:
        sess["state"] = "ticket_by_number"
        return "Escribe el *número de ticket* (solo el número, ej: *42*):"

    if by_phone:
        _reset(phone)
        try:
            tickets = await buscar_tickets_por_telefono(phone)
        except Exception:
            return "⚠️ Hubo un problema al consultar. Intenta de nuevo más tarde."

        if not tickets:
            return (
                "No encontré reparaciones asociadas a este número de WhatsApp.\n"
                "Si registraste otro teléfono, escribe *menu* y elige la opción "
                "de búsqueda por número de ticket."
            )
        if len(tickets) == 1:
            return _format_ticket(tickets[0]) + "\n\nEscribe *menu* para volver al inicio."

        lines = [f"Encontré *{len(tickets)}* reparaciones:\n"]
        for t in tickets:
            lines.append(
                f"• Ticket #{t['number']} — {t['device']} "
                f"({TICKET_STATUS.get(t['status'], t['status'])})"
            )
        lines.append("\nEscribe *menu* para volver al inicio.")
        return "\n".join(lines)

    return "Por favor escribe *1* para buscar por número de ticket o *2* para buscar por teléfono."


async def _ticket_by_number(phone: str, text: str) -> str:
    match = re.search(r"\d+", text)
    if not match:
        return "Por favor escribe solo el número de ticket (ej: *42*):"

    numero = int(match.group())
    try:
        ticket = await buscar_ticket_por_numero(numero)
    except Exception:
        return "⚠️ Hubo un problema al consultar. Intenta de nuevo más tarde."

    _reset(phone)
    if not ticket:
        return (
            f"No encontré ninguna reparación con el número *{numero}*.\n"
            "Verifica el número e intenta de nuevo.\n\n"
            "Escribe *menu* para volver al inicio."
        )
    return _format_ticket(ticket) + "\n\nEscribe *menu* para volver al inicio."


def _quote_name(phone: str, sess: dict, text: str) -> str:
    sess["quote_name"] = text.strip()
    sess["state"] = "quote_device"
    return f"Gracias, *{text.strip()}*. ¿Qué dispositivo necesitas reparar o revisar?\n(ej: iPhone 13, Laptop HP Pavilion, PS5)"


def _quote_device(phone: str, sess: dict, text: str) -> str:
    sess["quote_device"] = text.strip()
    sess["state"] = "quote_issue"
    return f"¿Cuál es el problema o qué servicio necesitas para tu *{text.strip()}*?"


async def _quote_issue(phone: str, sess: dict, text: str) -> str:
    name   = sess.get("quote_name", "Cliente WhatsApp")
    device = sess.get("quote_device", "Dispositivo")
    issue  = text.strip()
    clean_phone = phone.replace("whatsapp:", "").strip()

    try:
        ticket = await crear_ticket({
            "clientName":  name,
            "clientPhone": clean_phone,
            "device":      device,
            "issue":       issue,
        })
    except Exception:
        _reset(phone)
        return "⚠️ Ocurrió un error al registrar tu solicitud. Por favor intenta de nuevo más tarde."

    _reset(phone)
    return (
        f"✅ *¡Solicitud registrada!*\n\n"
        f"*Ticket #{ticket.get('number', '—')}*\n"
        f"Dispositivo: {device}\n"
        f"Problema: {issue}\n\n"
        f"Un técnico revisará tu caso y te contactará con el presupuesto.\n"
        f"Puedes consultar el estado en cualquier momento escribiendo *1*.\n\n"
        f"Escribe *menu* para volver al inicio."
    )
