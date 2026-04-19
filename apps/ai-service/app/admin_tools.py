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
    industry: str = "OTHER",
) -> dict | list:
    """Execute an admin tool and return the result."""
    logger.info("Admin tool call: %s  args=%s  tenant=%s", name, args, tenant_id)

    async with httpx.AsyncClient(timeout=30) as http:
        try:
            # ── Menú ──────────────────────────────────────────────────────────
            if name == "cargar_menu_dia":
                r = await http.post(
                    f"{BACKEND_URL}/admin-bot/menu-dia",
                    json={"tenantId": tenant_id, "items": args["items"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            # ── Productos ─────────────────────────────────────────────────────
            elif name == "agregar_actualizar_producto":
                payload = {"tenantId": tenant_id, "nombre": args["nombre"], "precio": args["precio"]}
                if "stock" in args:
                    payload["stock"] = args["stock"]
                if "descripcion" in args:
                    payload["descripcion"] = args["descripcion"]
                r = await http.post(f"{BACKEND_URL}/admin-bot/producto", json=payload, headers=_headers())
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

            elif name == "ver_stock_bajo":
                r = await http.get(f"{BACKEND_URL}/admin-bot/stock-bajo/{tenant_id}", headers=_headers())
                r.raise_for_status()
                return r.json()

            # ── Resúmenes ─────────────────────────────────────────────────────
            elif name == "resumen_dia":
                r = await http.get(f"{BACKEND_URL}/admin-bot/resumen-dia/{tenant_id}", headers=_headers())
                r.raise_for_status()
                return r.json()

            elif name == "resumen_mes":
                r = await http.get(f"{BACKEND_URL}/admin-bot/resumen-mes/{tenant_id}", headers=_headers())
                r.raise_for_status()
                return r.json()

            # ── Órdenes ───────────────────────────────────────────────────────
            elif name == "ver_ordenes_pendientes":
                r = await http.get(f"{BACKEND_URL}/admin-bot/ordenes/pendientes/{tenant_id}", headers=_headers())
                r.raise_for_status()
                return r.json()

            elif name == "ver_detalle_orden":
                r = await http.get(
                    f"{BACKEND_URL}/admin-bot/orden/buscar",
                    params={"tenantId": tenant_id, "numero": args["numero"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "cambiar_estado_orden":
                r = await http.patch(
                    f"{BACKEND_URL}/admin-bot/orden/{args['numero']}/estado",
                    json={"tenantId": tenant_id, "estado": args["estado"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            # ── Tickets ───────────────────────────────────────────────────────
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
                payload: dict = {"tenantId": tenant_id, "estado": args["estado"]}
                if foto:
                    payload["fotoUrl"] = foto
                r = await http.patch(
                    f"{BACKEND_URL}/admin-bot/ticket/{args['ticketId']}/estado",
                    json=payload,
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "crear_ticket":
                payload = {
                    "tenantId": tenant_id,
                    "clientName": args["clientName"],
                    "clientPhone": args.get("clientPhone", ""),
                    "device": args["device"],
                    "issue": args["issue"],
                }
                if media_url:
                    payload["fotoUrl"] = media_url
                r = await http.post(f"{BACKEND_URL}/admin-bot/ticket", json=payload, headers=_headers())
                r.raise_for_status()
                return r.json()

            elif name == "ver_cotizaciones_pendientes":
                r = await http.get(f"{BACKEND_URL}/admin-bot/cotizaciones/pendientes/{tenant_id}", headers=_headers())
                r.raise_for_status()
                return r.json()

            # ── Citas ─────────────────────────────────────────────────────────
            elif name == "ver_citas_dia":
                fecha = args.get("fecha", "")
                r = await http.get(
                    f"{BACKEND_URL}/admin-bot/citas/dia",
                    params={"tenantId": tenant_id, "fecha": fecha},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "crear_cita_admin":
                payload = {
                    "tenantId": tenant_id,
                    "clientName": args["clientName"],
                    "clientPhone": args["clientPhone"],
                    "serviceName": args["serviceName"],
                    "fecha": args["fecha"],
                    "hora": args["hora"],
                }
                if "profesionalNombre" in args:
                    payload["profesionalNombre"] = args["profesionalNombre"]
                r = await http.post(f"{BACKEND_URL}/admin-bot/citas/crear", json=payload, headers=_headers())
                r.raise_for_status()
                return r.json()

            elif name == "cambiar_estado_cita":
                r = await http.patch(
                    f"{BACKEND_URL}/admin-bot/citas/{args['appointmentId']}/estado",
                    json={"tenantId": tenant_id, "estado": args["estado"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            elif name == "reagendar_cita":
                r = await http.patch(
                    f"{BACKEND_URL}/admin-bot/citas/{args['appointmentId']}/reagendar",
                    json={"tenantId": tenant_id, "nuevaFecha": args["nuevaFecha"], "nuevaHora": args["nuevaHora"]},
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

            elif name == "notificar_pacientes_cancelados":
                r = await http.post(
                    f"{BACKEND_URL}/admin-bot/citas/notificar-cancelacion",
                    json={
                        "tenantId": tenant_id,
                        "industry": args.get("industry") or industry,
                        "pacientes": args["pacientes"],
                    },
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            # ── Contactos ─────────────────────────────────────────────────────
            elif name == "buscar_contacto":
                r = await http.get(
                    f"{BACKEND_URL}/admin-bot/contacto/buscar",
                    params={"tenantId": tenant_id, "query": args["query"]},
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            # ── Gastos ────────────────────────────────────────────────────────
            elif name == "registrar_gasto":
                r = await http.post(
                    f"{BACKEND_URL}/admin-bot/gasto",
                    json={
                        "tenantId": tenant_id,
                        "descripcion": args["descripcion"],
                        "monto": args["monto"],
                        "categoria": args.get("categoria", "General"),
                    },
                    headers=_headers(),
                )
                r.raise_for_status()
                return r.json()

            # ── Campañas ──────────────────────────────────────────────────────
            elif name == "crear_campaña_rapida":
                r = await http.post(
                    f"{BACKEND_URL}/admin-bot/campaña/rapida",
                    json={"tenantId": tenant_id, "mensaje": args["mensaje"]},
                    headers=_headers(),
                    timeout=60,
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


# ── Definiciones de tools por industria ───────────────────────────────────────

_TOOL_RESUMEN_DIA = {
    "name": "resumen_dia",
    "description": "Obtiene el resumen del día: ventas, citas, tickets, etc.",
    "input_schema": {"type": "object", "properties": {}, "required": []},
}

_TOOL_RESUMEN_MES = {
    "name": "resumen_mes",
    "description": "Obtiene el resumen del mes actual vs. el mes anterior: órdenes, ingresos, citas, contactos nuevos y gastos.",
    "input_schema": {"type": "object", "properties": {}, "required": []},
}

_TOOL_BUSCAR_CONTACTO = {
    "name": "buscar_contacto",
    "description": "Busca un contacto por nombre o teléfono en el CRM del negocio.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Nombre o número de teléfono a buscar."},
        },
        "required": ["query"],
    },
}

_TOOL_REGISTRAR_GASTO = {
    "name": "registrar_gasto",
    "description": "Registra un gasto o egreso del negocio.",
    "input_schema": {
        "type": "object",
        "properties": {
            "descripcion": {"type": "string", "description": "Descripción del gasto."},
            "monto": {"type": "number", "description": "Monto del gasto en la moneda local."},
            "categoria": {"type": "string", "description": "Categoría del gasto (Ingredientes, Servicios, Arriendo, Nómina, Otros)."},
        },
        "required": ["descripcion", "monto"],
    },
}

_TOOL_CAMPAÑA_RAPIDA = {
    "name": "crear_campaña_rapida",
    "description": "Envía un mensaje de WhatsApp a TODOS los contactos del negocio. Confirmar siempre antes de ejecutar.",
    "input_schema": {
        "type": "object",
        "properties": {
            "mensaje": {"type": "string", "description": "Mensaje a enviar a todos los contactos."},
        },
        "required": ["mensaje"],
    },
}

_TOOLS_COMMON = [_TOOL_RESUMEN_DIA, _TOOL_RESUMEN_MES, _TOOL_BUSCAR_CONTACTO, _TOOL_REGISTRAR_GASTO, _TOOL_CAMPAÑA_RAPIDA]

_TOOLS_RESTAURANT = [
    {
        "name": "cargar_menu_dia",
        "description": "Carga o reemplaza el menú del día con los platos de hoy. La IA extrae los platos del texto del admin.",
        "input_schema": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "description": "Lista de platos del menú del día.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "nombre": {"type": "string"},
                            "precio": {"type": "number"},
                            "descripcion": {"type": "string"},
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
    {
        "name": "ver_detalle_orden",
        "description": "Ver el detalle completo de una orden por su número.",
        "input_schema": {
            "type": "object",
            "properties": {
                "numero": {"type": "integer", "description": "Número de la orden."},
            },
            "required": ["numero"],
        },
    },
    {
        "name": "cambiar_estado_orden",
        "description": "Cambia el estado de una orden. Si pasa a READY, notifica automáticamente al cliente por WhatsApp.",
        "input_schema": {
            "type": "object",
            "properties": {
                "numero": {"type": "integer", "description": "Número de la orden."},
                "estado": {
                    "type": "string",
                    "enum": ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"],
                    "description": "Nuevo estado.",
                },
            },
            "required": ["numero", "estado"],
        },
    },
]

_TOOLS_TICKETS = [
    {
        "name": "buscar_ticket",
        "description": "Busca los últimos tickets por nombre del cliente.",
        "input_schema": {
            "type": "object",
            "properties": {
                "nombre": {"type": "string", "description": "Nombre del cliente."},
            },
            "required": ["nombre"],
        },
    },
    {
        "name": "crear_ticket",
        "description": "Crea un nuevo ticket de reparación cuando el cliente deja un equipo.",
        "input_schema": {
            "type": "object",
            "properties": {
                "clientName": {"type": "string", "description": "Nombre del cliente."},
                "clientPhone": {"type": "string", "description": "Teléfono del cliente."},
                "device": {"type": "string", "description": "Equipo a reparar (ej: 'Samsung A54', 'Laptop HP')."},
                "issue": {"type": "string", "description": "Descripción del problema o falla."},
            },
            "required": ["clientName", "clientPhone", "device", "issue"],
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
                },
                "fotoUrl": {"type": "string", "description": "URL de la foto adjunta (opcional)."},
            },
            "required": ["ticketId", "estado"],
        },
    },
    {
        "name": "ver_cotizaciones_pendientes",
        "description": "Muestra las cotizaciones en estado DRAFT o SENT pendientes de respuesta.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "ver_stock_bajo",
        "description": "Lista los productos con stock igual o menor al mínimo configurado.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]

_TOOLS_CITAS = [
    {
        "name": "ver_citas_dia",
        "description": "Muestra todas las citas agendadas para una fecha específica con horario, cliente, servicio y profesional.",
        "input_schema": {
            "type": "object",
            "properties": {
                "fecha": {"type": "string", "description": "Fecha en formato YYYY-MM-DD. Usa la fecha de hoy si no se especifica."},
            },
            "required": ["fecha"],
        },
    },
    {
        "name": "crear_cita_admin",
        "description": "Crea una cita manualmente desde el admin (para reservas por teléfono o presencial).",
        "input_schema": {
            "type": "object",
            "properties": {
                "clientName": {"type": "string", "description": "Nombre del cliente."},
                "clientPhone": {"type": "string", "description": "Teléfono del cliente."},
                "serviceName": {"type": "string", "description": "Nombre del servicio (se busca automáticamente)."},
                "fecha": {"type": "string", "description": "Fecha en formato YYYY-MM-DD."},
                "hora": {"type": "string", "description": "Hora en formato HH:MM (24h UTC)."},
                "profesionalNombre": {"type": "string", "description": "Nombre del profesional (opcional)."},
            },
            "required": ["clientName", "clientPhone", "serviceName", "fecha", "hora"],
        },
    },
    {
        "name": "cambiar_estado_cita",
        "description": "Cambia el estado de una cita individual (CONFIRMED, COMPLETED, NO_SHOW, CANCELLED).",
        "input_schema": {
            "type": "object",
            "properties": {
                "appointmentId": {"type": "string", "description": "ID de la cita (obtenido de ver_citas_dia)."},
                "estado": {
                    "type": "string",
                    "enum": ["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
                },
            },
            "required": ["appointmentId", "estado"],
        },
    },
    {
        "name": "reagendar_cita",
        "description": "Reagenda una cita a una nueva fecha y hora. Notifica automáticamente al cliente por WhatsApp.",
        "input_schema": {
            "type": "object",
            "properties": {
                "appointmentId": {"type": "string", "description": "ID de la cita (obtenido de ver_citas_dia)."},
                "nuevaFecha": {"type": "string", "description": "Nueva fecha en formato YYYY-MM-DD."},
                "nuevaHora": {"type": "string", "description": "Nueva hora en formato HH:MM (24h UTC)."},
            },
            "required": ["appointmentId", "nuevaFecha", "nuevaHora"],
        },
    },
    {
        "name": "cancelar_citas_rango",
        "description": "Cancela todas las citas de un rango horario. Después usar notificar_pacientes_cancelados.",
        "input_schema": {
            "type": "object",
            "properties": {
                "fecha": {"type": "string", "description": "Fecha en formato YYYY-MM-DD."},
                "horaDesde": {"type": "string", "description": "Hora desde en HH:MM (UTC). Omitir para cancelar todo el día."},
                "profesionalId": {"type": "string", "description": "ID del profesional (opcional)."},
            },
            "required": ["fecha"],
        },
    },
    {
        "name": "notificar_pacientes_cancelados",
        "description": "Envía WhatsApp a cada paciente afectado informando la cancelación y pidiéndoles reagendar. Usar siempre después de cancelar_citas_rango.",
        "input_schema": {
            "type": "object",
            "properties": {
                "pacientes": {
                    "type": "array",
                    "description": "Lista de pacientes del campo clientesAfectados de cancelar_citas_rango.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "nombre": {"type": "string"},
                            "telefono": {"type": "string"},
                            "servicio": {"type": "string"},
                            "hora": {"type": "string"},
                            "profesional": {"type": "string"},
                        },
                        "required": ["nombre", "telefono", "servicio", "hora"],
                    },
                },
            },
            "required": ["pacientes"],
        },
    },
]

_TOOLS_CLOTHING = [
    {
        "name": "agregar_actualizar_producto",
        "description": "Agrega un producto nuevo o actualiza uno existente por nombre.",
        "input_schema": {
            "type": "object",
            "properties": {
                "nombre": {"type": "string"},
                "precio": {"type": "number"},
                "stock": {"type": "number"},
                "descripcion": {"type": "string"},
            },
            "required": ["nombre", "precio"],
        },
    },
    {
        "name": "actualizar_stock",
        "description": "Actualiza el stock de un producto por nombre.",
        "input_schema": {
            "type": "object",
            "properties": {
                "nombre": {"type": "string"},
                "stock": {"type": "number"},
            },
            "required": ["nombre", "stock"],
        },
    },
    {
        "name": "actualizar_precio",
        "description": "Actualiza el precio de un producto por nombre.",
        "input_schema": {
            "type": "object",
            "properties": {
                "nombre": {"type": "string"},
                "precio": {"type": "number"},
            },
            "required": ["nombre", "precio"],
        },
    },
    {
        "name": "eliminar_producto",
        "description": "Elimina (desactiva) un producto por nombre.",
        "input_schema": {
            "type": "object",
            "properties": {
                "nombre": {"type": "string"},
            },
            "required": ["nombre"],
        },
    },
    {
        "name": "ver_stock_bajo",
        "description": "Lista los productos con stock igual o menor al mínimo configurado.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]


def get_admin_tools(industry: str) -> list:
    """Return the Claude tool list for the given industry."""
    upper = (industry or "").upper()

    if upper in ("RESTAURANT", "BAKERY"):
        return _TOOLS_COMMON + _TOOLS_RESTAURANT

    elif upper in ("TECH_STORE", "WORKSHOP"):
        return _TOOLS_COMMON + _TOOLS_TICKETS

    elif upper in ("CLINIC", "BEAUTY", "VETERINARY"):
        return _TOOLS_COMMON + _TOOLS_CITAS

    elif upper == "CLOTHING_STORE":
        return _TOOLS_COMMON + _TOOLS_CLOTHING

    elif upper == "GYM":
        # Gymns use appointments for classes + product tools for memberships
        return _TOOLS_COMMON + _TOOLS_CITAS

    elif upper in ("HOTEL",):
        # Hotels use appointments for reservations
        return _TOOLS_COMMON + _TOOLS_CITAS

    elif upper == "PHARMACY":
        # Pharmacies need product/stock management
        return _TOOLS_COMMON + _TOOLS_CLOTHING

    else:
        return _TOOLS_COMMON
