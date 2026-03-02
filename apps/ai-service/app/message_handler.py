"""
Conversation state machine for the Automatiza360 WhatsApp bot.

States per user phone number:
  idle                → detect intent from free text / option number
  ticket_search       → choose lookup method (by number or by phone)
  ticket_by_number    → waiting for the sequential ticket number

  service_type        → asking: repair (1) or quote (2)?

  repair_name         → collecting client name   (→ Ticket)
  repair_device       → collecting device description
  repair_issue        → collecting problem description → creates Ticket

  cotizacion_name     → collecting client name   (→ Cotizacion)
  cotizacion_products → showing product list, waiting for selection
  cotizacion_qty      → waiting for quantity → creates Cotizacion
"""

from __future__ import annotations

import logging
import re

from app.backend_client import (
    buscar_ticket_por_numero,
    buscar_tickets_por_telefono,
    crear_cotizacion,
    crear_ticket,
    get_productos,
)

logger = logging.getLogger(__name__)

# In-memory sessions keyed by WhatsApp "From" value (e.g. "whatsapp:+521234567890").
# Replace with Redis for multi-instance deployments.
_sessions: dict[str, dict] = {}

# ── Constants ──────────────────────────────────────────────────────────────────

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
    "cómo está", "como esta", "cuánto falta", "cuanto falta",
    "mi celular", "mi laptop", "mi pc", "mi computadora",
)

_SERVICE_KEYWORDS = (
    "cotizaci", "presupuesto", "cuánto cuesta", "cuanto cuesta",
    "precio", "cuánto cobran", "cuanto cobran",
    "quiero reparar", "necesito reparar", "pueden reparar",
)

MAX_PRODUCTS = 10  # cap product list to keep WhatsApp message readable

# ── Session helpers ────────────────────────────────────────────────────────────

def _sess(phone: str) -> dict:
    if phone not in _sessions:
        _sessions[phone] = {"state": "idle"}
    return _sessions[phone]


def _reset(phone: str) -> None:
    _sessions[phone] = {"state": "idle"}


# ── Formatting ─────────────────────────────────────────────────────────────────

def _fmt_ticket(t: dict) -> str:
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


def _fmt_products(products: list[dict]) -> str:
    lines = ["¿Qué producto deseas cotizar? Escribe el número:\n"]
    for i, p in enumerate(products, 1):
        lines.append(f"{i}. *{p['name']}* — ${p['price']:.2f}")
    return "\n".join(lines)


# ── Main entry point ───────────────────────────────────────────────────────────

async def handle_message(phone: str, text: str) -> str:
    sess = _sess(phone)
    lower = text.lower()

    # Global reset — any state
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
    if state == "service_type":
        return await _service_type(phone, sess, text, lower)
    if state == "repair_name":
        return _repair_name(phone, sess, text)
    if state == "repair_device":
        return _repair_device(phone, sess, text)
    if state == "repair_issue":
        return await _repair_issue(phone, sess, text)
    if state == "cotizacion_name":
        return await _cotizacion_name(phone, sess, text)
    if state == "cotizacion_products":
        return await _cotizacion_products(phone, sess, text)
    if state == "cotizacion_qty":
        return await _cotizacion_qty(phone, sess, text)

    _reset(phone)
    return WELCOME


# ── State handlers ─────────────────────────────────────────────────────────────

async def _idle(phone: str, sess: dict, text: str, lower: str) -> str:
    wants_ticket  = text == "1" or any(kw in lower for kw in _TICKET_KEYWORDS)
    wants_service = text == "2" or any(kw in lower for kw in _SERVICE_KEYWORDS)

    if wants_ticket:
        sess["state"] = "ticket_search"
        return (
            "Puedo buscar tu reparación de dos formas:\n"
            "1️⃣  Por *número de ticket* (ej: *42*)\n"
            "2️⃣  Por el *teléfono registrado* al dejar el equipo\n\n"
            "Escribe *1* o *2*."
        )

    if wants_service:
        sess["state"] = "service_type"
        return (
            "¿Qué tipo de servicio necesitas?\n"
            "1️⃣  *Reparación* — traes tu dispositivo para que lo revisemos\n"
            "2️⃣  *Cotización* — quieres saber el precio de un producto o servicio\n\n"
            "Escribe *1* o *2*."
        )

    return WELCOME


async def _ticket_search(phone: str, sess: dict, text: str, lower: str) -> str:
    by_number = text == "1" or any(w in lower for w in ("número", "numero", "ticket", "folio"))
    by_phone  = text == "2" or any(w in lower for w in ("teléfono", "telefono", "celular"))

    if by_number:
        sess["state"] = "ticket_by_number"
        return "Escribe el *número de ticket* (solo el número, ej: *42*):"

    if by_phone:
        _reset(phone)
        try:
            tickets = await buscar_tickets_por_telefono(phone)
        except Exception as exc:
            logger.error("Error fetching tickets by phone: %s", exc, exc_info=True)
            return "⚠️ Hubo un problema al consultar. Intenta de nuevo más tarde."

        if not tickets:
            return (
                "No encontré reparaciones asociadas a este número de WhatsApp.\n"
                "Si registraste otro teléfono, escribe *menu* y elige la opción "
                "de búsqueda por número de ticket."
            )
        if len(tickets) == 1:
            return _fmt_ticket(tickets[0]) + "\n\nEscribe *menu* para volver al inicio."

        lines = [f"Encontré *{len(tickets)}* reparaciones:\n"]
        for t in tickets:
            lines.append(
                f"• Ticket #{t['number']} — {t['device']} "
                f"({TICKET_STATUS.get(t['status'], t['status'])})"
            )
        lines.append("\nEscribe *menu* para volver al inicio.")
        return "\n".join(lines)

    return "Escribe *1* para buscar por número de ticket o *2* para buscar por teléfono."


async def _ticket_by_number(phone: str, text: str) -> str:
    match = re.search(r"\d+", text)
    if not match:
        return "Por favor escribe solo el número de ticket (ej: *42*):"

    numero = int(match.group())
    try:
        ticket = await buscar_ticket_por_numero(numero)
    except Exception as exc:
        logger.error("Error fetching ticket #%s: %s", numero, exc, exc_info=True)
        return "⚠️ Hubo un problema al consultar. Intenta de nuevo más tarde."

    _reset(phone)
    if not ticket:
        return (
            f"No encontré ninguna reparación con el número *{numero}*.\n"
            "Verifica e intenta de nuevo.\n\n"
            "Escribe *menu* para volver al inicio."
        )
    return _fmt_ticket(ticket) + "\n\nEscribe *menu* para volver al inicio."


# ── Service type branch ────────────────────────────────────────────────────────

async def _service_type(phone: str, sess: dict, text: str, lower: str) -> str:
    is_repair = text == "1" or any(w in lower for w in ("reparaci", "arreglar", "revisar", "componer"))
    is_quote  = text == "2" or any(w in lower for w in ("cotizaci", "precio", "presupuesto", "cuánto", "cuanto"))

    if is_repair:
        sess["state"] = "repair_name"
        return "¡Perfecto! ¿Cuál es tu *nombre completo*?"

    if is_quote:
        sess["state"] = "cotizacion_name"
        return "¡Con gusto! ¿Cuál es tu *nombre completo*?"

    return "Por favor escribe *1* para reparación o *2* para cotización."


# ── Repair flow (→ Ticket) ─────────────────────────────────────────────────────

def _repair_name(phone: str, sess: dict, text: str) -> str:
    sess["repair_name"] = text.strip()
    sess["state"] = "repair_device"
    return (
        f"Gracias, *{text.strip()}*. "
        "¿Qué dispositivo necesitas reparar?\n"
        "(ej: iPhone 13, Laptop HP Pavilion, PS5)"
    )


def _repair_device(phone: str, sess: dict, text: str) -> str:
    sess["repair_device"] = text.strip()
    sess["state"] = "repair_issue"
    return f"¿Cuál es el problema con tu *{text.strip()}*?"


async def _repair_issue(phone: str, sess: dict, text: str) -> str:
    name        = sess.get("repair_name", "Cliente WhatsApp")
    device      = sess.get("repair_device", "Dispositivo")
    issue       = text.strip()
    clean_phone = phone.replace("whatsapp:", "").strip()

    try:
        ticket = await crear_ticket({
            "clientName":  name,
            "clientPhone": clean_phone,
            "device":      device,
            "issue":       issue,
        })
    except Exception as exc:
        logger.error("Error creating ticket: %s", exc, exc_info=True)
        _reset(phone)
        return "⚠️ Ocurrió un error al registrar tu solicitud. Intenta de nuevo más tarde."

    _reset(phone)
    return (
        f"✅ *¡Solicitud de reparación registrada!*\n\n"
        f"*Ticket #{ticket.get('number', '—')}*\n"
        f"Dispositivo: {device}\n"
        f"Problema: {issue}\n\n"
        f"Un técnico revisará tu equipo y te contactará pronto.\n"
        f"Escribe *1* en cualquier momento para consultar el estado.\n\n"
        f"Escribe *menu* para volver al inicio."
    )


# ── Cotizacion flow (→ Cotizacion) ─────────────────────────────────────────────

async def _cotizacion_name(phone: str, sess: dict, text: str) -> str:
    sess["cotizacion_name"] = text.strip()

    try:
        products = await get_productos()
    except Exception as exc:
        logger.error("Error fetching products for quotation: %s", exc, exc_info=True)
        _reset(phone)
        return "⚠️ No pude cargar el catálogo en este momento. Intenta de nuevo más tarde."

    if not products:
        _reset(phone)
        return (
            "No hay productos disponibles en el catálogo en este momento.\n"
            "Contáctanos directamente para solicitar una cotización personalizada.\n\n"
            "Escribe *menu* para volver al inicio."
        )

    displayed = products[:MAX_PRODUCTS]
    sess["cotizacion_products"] = displayed
    sess["state"] = "cotizacion_products"
    return _fmt_products(displayed)


async def _cotizacion_products(phone: str, sess: dict, text: str) -> str:
    products: list[dict] = sess.get("cotizacion_products", [])
    match = re.search(r"\d+", text)

    if not match:
        return "Por favor escribe el *número* del producto que deseas cotizar."

    idx = int(match.group()) - 1
    if idx < 0 or idx >= len(products):
        return (
            f"Número inválido. Elige entre 1 y {len(products)}:\n\n"
            + _fmt_products(products)
        )

    sess["cotizacion_product_idx"] = idx
    product = products[idx]
    sess["state"] = "cotizacion_qty"
    return f"¿Cuántas unidades de *{product['name']}* necesitas?"


async def _cotizacion_qty(phone: str, sess: dict, text: str) -> str:
    match = re.search(r"\d+", text)
    if not match or int(match.group()) < 1:
        return "Por favor escribe una cantidad válida (número entero mayor a 0):"

    qty = int(match.group())
    products: list[dict]  = sess.get("cotizacion_products", [])
    idx: int              = sess.get("cotizacion_product_idx", 0)
    product               = products[idx]
    name                  = sess.get("cotizacion_name", "Cliente WhatsApp")
    clean_phone           = phone.replace("whatsapp:", "").strip()

    try:
        cotizacion = await crear_cotizacion({
            "clientName":  name,
            "clientPhone": clean_phone,
            "items": [{"productId": product["id"], "quantity": qty}],
        })
    except Exception as exc:
        logger.error("Error creating cotizacion: %s", exc, exc_info=True)
        _reset(phone)
        return "⚠️ Ocurrió un error al generar la cotización. Intenta de nuevo más tarde."

    subtotal = product["price"] * qty
    _reset(phone)
    return (
        f"✅ *¡Cotización generada!*\n\n"
        f"*Cotización #{cotizacion.get('number', '—')}*\n"
        f"Producto: {product['name']}\n"
        f"Cantidad: {qty}\n"
        f"Precio unitario: ${product['price']:.2f}\n"
        f"*Total: ${subtotal:.2f}*\n\n"
        f"Un asesor se pondrá en contacto contigo para confirmar.\n\n"
        f"Escribe *menu* para volver al inicio."
    )
