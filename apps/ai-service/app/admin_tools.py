"""
Admin tools for the WhatsApp Admin Mode.

Tools available to business owners/admins managing their business via WhatsApp.
Uses X-Internal-Key for backend authentication (no JWT needed).
"""

from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3000")
INTERNAL_KEY = os.environ.get("INTERNAL_API_KEY", "")


def _headers() -> dict:
    return {"X-Internal-Key": INTERNAL_KEY, "Content-Type": "application/json"}


async def execute_admin_tool(
    name: str,
    args: dict,
    phone: str,
    client,
    tenant_id: str,
    media_url: str | None,
) -> dict | list:
    """Execute an admin tool and return the result."""
    logger.info("Admin tool call: %s  args=%s  tenant=%s", name, args, tenant_id)

    async with httpx.AsyncClient(timeout=30) as http:
        try:
            if name == "cargar_menu_dia":
                r = await http.post(
                    f"{BACKEND_URL}/admin-bot/menu-dia",
                    json={"tenantId": tenant_id, "items": args["items"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "agregar_actualizar_producto":
                payload = {"tenantId": tenant_id, "nombre": args["nombre"], "precio": args["precio"]}
                if "stock" in args:
                    payload["stock"] = args["stock"]
                if "descripcion" in args:
                    payload["descripcion"] = args["descripcion"]
                r = await http.post(
                    f"{BACKEND_URL}/admin-bot/producto",
                    json=payload,
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "actualizar_stock":
                r = await http.patch(
                    f"{BACKEND_URL}/admin-bot/producto/stock",
                    json={"tenantId": tenant_id, "nombre": args["nombre"], "stock": args["stock"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "actualizar_precio":
                r = await http.patch(
                    f"{BACKEND_URL}/admin-bot/producto/precio",
                    json={"tenantId": tenant_id, "nombre": args["nombre"], "precio": args["precio"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "eliminar_producto":
                r = await http.request(
                    "DELETE",
                    f"{BACKEND_URL}/admin-bot/producto",
                    json={"tenantId": tenant_id, "nombre": args["nombre"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "resumen_dia":
                r = await http.get(
                    f"{BACKEND_URL}/admin-bot/resumen-dia/{tenant_id}",
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "buscar_ticket":
                r = await http.get(
                    f"{BACKEND_URL}/admin-bot/ticket/buscar",
                    params={"tenantId": tenant_id, "nombre": args["nombre"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "cambiar_estado_ticket":
                foto = args.get("fotoUrl") or media_url
                payload: dict = {
                    "tenantId": tenant_id,
                    "estado": args["estado"],
                }
                if foto:
                    payload["fotoUrl"] = foto
                r = await http.patch(
                    f"{BACKEND_URL}/admin-bot/ticket/{args['ticketId']}/estado",
                    json=payload,
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "cancelar_citas_rango":
                payload = {"tenantId": tenant_id, "fecha": args["fecha"]}
                if "horaDesde" in args:
                    payload["horaDesde"] = args["horaDesde"]
                if "profesionalId" in args:
                    payload["profesionalId"] = args["profesionalId"]
                r = await http.post(
                    f"{BACKEND_URL}/admin-bot/citas/cancelar-rango",
                    json=payload,
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "ver_ordenes_pendientes":
                r = await http.get(
                    f"{BACKEND_URL}/admin-bot/ordenes/pendientes/{tenant_id}",
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            else:
                return {"error": f"Herramienta desconocida: {name}"}

        except httpx.HTTPStatusError as exc:
            logger.error("Admin tool %s HTTP error: %s", name, exc)
            try:
                detail = exc.response.json()
            except Exception:
                detail = exc.response.text
            return {"error": f"Error del servidor: {detail}"}
        except Exception as exc:
            logger.error("Admin tool %s failed: %s", name, exc, exc_info=True)
            return {"error": str(exc)}


def get_admin_tools(industry: str) -> list:
    """Return the Claude tool list for the given industry."""
    common = [
        {
            "name": "resumen_dia",
            "description": "Obtiene el resumen del día del negocio: ventas, citas, tickets, etc.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        }
    ]

    restaurant_tools = [
        {
            "name": "cargar_menu_dia",
            "description": "Carga o reemplaza el menú del día con los platos especiales de hoy.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "description": "Lista de platos del menú del día.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "nombre": {"type": "string", "description": "Nombre del plato."},
                                "precio": {"type": "number", "description": "Precio del plato."},
                                "descripcion": {"type": "string", "description": "Descripción del plato (opcional)."},
                            },
                            "required": ["nombre", "precio"],
                        },
                    }
                },
                "required": ["items"],
            },
        },
        {
            "name": "ver_ordenes_pendientes",
            "description": "Muestra las órdenes pendientes del día (PENDING, CONFIRMED, PREPARING).",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
    ]

    ticket_tools = [
        {
            "name": "buscar_ticket",
            "description": "Busca los últimos 3 tickets por nombre del cliente.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "nombre": {"type": "string", "description": "Nombre del cliente a buscar."}
                },
                "required": ["nombre"],
            },
        },
        {
            "name": "cambiar_estado_ticket",
            "description": "Cambia el estado de un ticket y opcionalmente adjunta una foto.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "ticketId": {"type": "string", "description": "ID del ticket."},
                    "estado": {
                        "type": "string",
                        "enum": ["RECEIVED", "DIAGNOSING", "WAITING_PARTS", "REPAIRING", "READY", "DELIVERED", "CANCELLED"],
                        "description": "Nuevo estado del ticket.",
                    },
                    "fotoUrl": {"type": "string", "description": "URL de la foto adjunta (opcional)."},
                },
                "required": ["ticketId", "estado"],
            },
        },
    ]

    citas_tools = [
        {
            "name": "cancelar_citas_rango",
            "description": "Cancela citas en un rango horario y devuelve los pacientes afectados con sus teléfonos.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "fecha": {"type": "string", "description": "Fecha en formato YYYY-MM-DD."},
                    "horaDesde": {"type": "string", "description": "Hora desde en formato HH:MM (UTC). Si se omite, cancela todas las citas del día."},
                    "profesionalId": {"type": "string", "description": "ID del profesional (opcional, para filtrar por profesional)."},
                },
                "required": ["fecha"],
            },
        },
    ]

    clothing_tools = [
        {
            "name": "agregar_actualizar_producto",
            "description": "Agrega un producto nuevo o actualiza uno existente por nombre (búsqueda case-insensitive).",
            "input_schema": {
                "type": "object",
                "properties": {
                    "nombre": {"type": "string", "description": "Nombre del producto."},
                    "precio": {"type": "number", "description": "Precio del producto."},
                    "stock": {"type": "number", "description": "Cantidad en stock (opcional)."},
                    "descripcion": {"type": "string", "description": "Descripción del producto (opcional)."},
                },
                "required": ["nombre", "precio"],
            },
        },
        {
            "name": "actualizar_stock",
            "description": "Actualiza el stock de un producto buscándolo por nombre.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "nombre": {"type": "string", "description": "Nombre del producto."},
                    "stock": {"type": "number", "description": "Nueva cantidad en stock."},
                },
                "required": ["nombre", "stock"],
            },
        },
        {
            "name": "actualizar_precio",
            "description": "Actualiza el precio de un producto buscándolo por nombre.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "nombre": {"type": "string", "description": "Nombre del producto."},
                    "precio": {"type": "number", "description": "Nuevo precio."},
                },
                "required": ["nombre", "precio"],
            },
        },
        {
            "name": "eliminar_producto",
            "description": "Elimina (soft-delete) un producto por nombre.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "nombre": {"type": "string", "description": "Nombre del producto a eliminar."}
                },
                "required": ["nombre"],
            },
        },
    ]

    upper = (industry or "").upper()

    if upper in ("RESTAURANT", "BAKERY"):
        return common + restaurant_tools
    elif upper in ("TECH_STORE", "WORKSHOP"):
        return common + ticket_tools
    elif upper in ("CLINIC", "BEAUTY", "VETERINARY"):
        return common + citas_tools
    elif upper == "CLOTHING_STORE":
        return common + clothing_tools
    else:
        return common
