"""
Tool schemas and async executors for the Gemini agent.

Each function below is a schema-only definition (empty body with a detailed
docstring) that the google-generativeai SDK uses to auto-generate the JSON
schema sent to Gemini.  Actual execution is async and lives in execute_tool().
"""

from __future__ import annotations

import json
import logging

from app import backend_client

logger = logging.getLogger(__name__)


# ── Tool schemas (Gemini reads the signature + docstring) ─────────────────────

def consultar_inventario(busqueda: str = "", presupuesto_max: float = 0.0) -> list:
    """
    Consulta el inventario real de productos disponibles en la tienda.
    SIEMPRE llama esta herramienta antes de recomendar o cotizar cualquier producto.
    Nunca inventes productos ni precios que no estén aquí.

    Args:
        busqueda: Término de búsqueda libre (ej: "laptop gaming", "celular", "monitor").
                  Deja vacío para obtener todo el catálogo.
        presupuesto_max: Precio máximo en MXN (0 = sin límite de precio).
    """
    ...


def ver_reparacion(numero_ticket: int) -> dict:
    """
    Obtiene el estado actual de una reparación por su número de ticket.
    Úsala cuando el cliente mencione su número de ticket.

    Args:
        numero_ticket: Número de ticket (ej: 42). Solo el número, sin prefijos.
    """
    ...


def ver_mis_reparaciones() -> list:
    """
    Busca todas las reparaciones registradas con el número de WhatsApp del cliente.
    Úsala cuando el cliente pregunte por sus reparaciones sin mencionar un número
    de ticket específico.
    """
    ...


def registrar_reparacion(
    nombre_cliente: str,
    dispositivo: str,
    problema: str,
) -> dict:
    """
    Registra una nueva solicitud de reparación y crea un ticket de servicio.
    Úsala solo cuando tengas los tres datos completos: nombre, dispositivo y problema.
    No la llames antes de confirmar la información con el cliente.

    Args:
        nombre_cliente: Nombre completo del cliente.
        dispositivo: Marca y modelo exacto (ej: "iPhone 13 Pro", "Laptop HP Pavilion 15").
        problema: Descripción detallada del problema o falla que presenta el equipo.
    """
    ...


def generar_cotizacion(
    nombre_cliente: str,
    product_id: str,
    cantidad: int,
) -> dict:
    """
    Genera una cotización formal para un producto del inventario.
    Úsala solo después de que el cliente haya confirmado exactamente qué producto quiere.
    Obtén el product_id llamando primero a consultar_inventario.

    Args:
        nombre_cliente: Nombre completo del cliente.
        product_id: ID único del producto (campo 'id' devuelto por consultar_inventario).
        cantidad: Número de unidades a cotizar (mínimo 1).
    """
    ...


# Exported list — passed directly to GenerativeModel(tools=...)
ALL_TOOLS = [
    consultar_inventario,
    ver_reparacion,
    ver_mis_reparaciones,
    registrar_reparacion,
    generar_cotizacion,
]


# ── Async executor ─────────────────────────────────────────────────────────────

async def execute_tool(name: str, args: dict, phone: str) -> str:
    """
    Execute a tool requested by Gemini and return a JSON string with the result.
    'phone' is the raw Twilio From value (e.g. 'whatsapp:+521234567890').
    """
    clean_phone = phone.replace("whatsapp:", "").strip()
    logger.info("Tool call: %s  args=%s", name, args)

    try:
        if name == "consultar_inventario":
            products = await backend_client.get_productos()
            busqueda = str(args.get("busqueda", "")).lower()
            presupuesto = float(args.get("presupuesto_max", 0) or 0)

            if busqueda:
                products = [
                    p for p in products
                    if busqueda in p["name"].lower()
                    or busqueda in (p.get("description") or "").lower()
                ]
            if presupuesto > 0:
                products = [p for p in products if p["price"] <= presupuesto]

            return json.dumps(products[:10], ensure_ascii=False)

        if name == "ver_reparacion":
            numero = int(args["numero_ticket"])
            ticket = await backend_client.buscar_ticket_por_numero(numero)
            if not ticket:
                return json.dumps(
                    {"error": f"No se encontró ningún ticket con el número {numero}."},
                    ensure_ascii=False,
                )
            return json.dumps(ticket, ensure_ascii=False)

        if name == "ver_mis_reparaciones":
            tickets = await backend_client.buscar_tickets_por_telefono(phone)
            if not tickets:
                return json.dumps(
                    {"mensaje": "No se encontraron reparaciones para este número de WhatsApp."},
                    ensure_ascii=False,
                )
            return json.dumps(tickets, ensure_ascii=False)

        if name == "registrar_reparacion":
            ticket = await backend_client.crear_ticket({
                "clientName":  args["nombre_cliente"],
                "clientPhone": clean_phone,
                "device":      args["dispositivo"],
                "issue":       args["problema"],
            })
            return json.dumps(ticket, ensure_ascii=False)

        if name == "generar_cotizacion":
            cotizacion = await backend_client.crear_cotizacion({
                "clientName":  args["nombre_cliente"],
                "clientPhone": clean_phone,
                "items": [{
                    "productId": args["product_id"],
                    "quantity":  int(args["cantidad"]),
                }],
            })
            return json.dumps(cotizacion, ensure_ascii=False)

        return json.dumps({"error": f"Herramienta '{name}' no reconocida."})

    except Exception as exc:
        logger.error("Tool %s failed: %s", name, exc, exc_info=True)
        return json.dumps({"error": str(exc)}, ensure_ascii=False)
