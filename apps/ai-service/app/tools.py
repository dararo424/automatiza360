"""
Tool declarations and async executors for the Gemini agent.

Each tool is a types.FunctionDeclaration (google-genai SDK v1+) with an
explicit JSON schema — no Python function introspection, no default-value
compatibility issues.  Actual execution is async and lives in execute_tool().
"""

from __future__ import annotations

import json
import logging

from google.genai import types

from app import backend_client

logger = logging.getLogger(__name__)


# ── Tool declarations ─────────────────────────────────────────────────────────

_consultar_inventario = types.FunctionDeclaration(
    name="consultar_inventario",
    description=(
        "Consulta el inventario real de productos disponibles en la tienda. "
        "SIEMPRE llama esta herramienta antes de recomendar o cotizar cualquier producto. "
        "Nunca inventes productos ni precios que no estén aquí."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "busqueda": types.Schema(
                type=types.Type.STRING,
                description=(
                    "Término de búsqueda libre (ej: 'laptop gaming', 'celular', 'monitor'). "
                    "Deja vacío para obtener todo el catálogo."
                ),
            ),
            "presupuesto_max": types.Schema(
                type=types.Type.NUMBER,
                description="Precio máximo en MXN. Usa 0 para sin límite de precio.",
            ),
        },
        required=[],
    ),
)

_ver_reparacion = types.FunctionDeclaration(
    name="ver_reparacion",
    description=(
        "Obtiene el estado actual de una reparación por su número de ticket. "
        "Úsala cuando el cliente mencione su número de ticket."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "numero_ticket": types.Schema(
                type=types.Type.INTEGER,
                description="Número de ticket (ej: 42). Solo el número, sin prefijos.",
            ),
        },
        required=["numero_ticket"],
    ),
)

_ver_mis_reparaciones = types.FunctionDeclaration(
    name="ver_mis_reparaciones",
    description=(
        "Busca todas las reparaciones registradas con el número de WhatsApp del cliente. "
        "Úsala cuando el cliente pregunte por sus reparaciones sin mencionar un número "
        "de ticket específico."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={},
    ),
)

_registrar_reparacion = types.FunctionDeclaration(
    name="registrar_reparacion",
    description=(
        "Registra una nueva solicitud de reparación y crea un ticket de servicio. "
        "Úsala solo cuando tengas los tres datos completos: nombre, dispositivo y problema. "
        "No la llames antes de confirmar la información con el cliente."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "nombre_cliente": types.Schema(
                type=types.Type.STRING,
                description="Nombre completo del cliente.",
            ),
            "dispositivo": types.Schema(
                type=types.Type.STRING,
                description=(
                    "Marca y modelo exacto del dispositivo "
                    "(ej: 'iPhone 13 Pro', 'Laptop HP Pavilion 15')."
                ),
            ),
            "problema": types.Schema(
                type=types.Type.STRING,
                description="Descripción detallada del problema o falla que presenta el equipo.",
            ),
        },
        required=["nombre_cliente", "dispositivo", "problema"],
    ),
)

_generar_cotizacion = types.FunctionDeclaration(
    name="generar_cotizacion",
    description=(
        "Genera una cotización formal para un producto del inventario. "
        "Úsala solo después de que el cliente haya confirmado exactamente qué producto quiere. "
        "Obtén el product_id llamando primero a consultar_inventario."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "nombre_cliente": types.Schema(
                type=types.Type.STRING,
                description="Nombre completo del cliente.",
            ),
            "product_id": types.Schema(
                type=types.Type.STRING,
                description=(
                    "ID único del producto (campo 'id' devuelto por consultar_inventario)."
                ),
            ),
            "cantidad": types.Schema(
                type=types.Type.INTEGER,
                description="Número de unidades a cotizar (mínimo 1).",
            ),
        },
        required=["nombre_cliente", "product_id", "cantidad"],
    ),
)


# Exported list — passed directly to GenerateContentConfig(tools=...)
ALL_TOOLS = [
    types.Tool(function_declarations=[
        _consultar_inventario,
        _ver_reparacion,
        _ver_mis_reparaciones,
        _registrar_reparacion,
        _generar_cotizacion,
    ])
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
            busqueda = str(args.get("busqueda", "")).lower()
            presupuesto = float(args.get("presupuesto_max", 0) or 0)

            if busqueda:
                # Buscar en inventario propio + catálogos de proveedores en paralelo
                resultado = await backend_client.buscar_en_proveedores(busqueda)
                propios = resultado.get("propios", [])
                catalogo = resultado.get("catalogo", [])
            else:
                # Sin búsqueda: solo inventario propio
                propios = await backend_client.get_productos()
                catalogo = []

            # Filtrar por presupuesto
            if presupuesto > 0:
                propios = [p for p in propios if p["price"] <= presupuesto]
                catalogo = [p for p in catalogo if p["price"] <= presupuesto]

            # Combinar resultados con etiqueta de origen
            combinados = []
            for p in propios[:5]:
                combinados.append({**p, "fuente": "inventario_propio", "disponible": True})
            for p in catalogo[:10]:
                combinados.append({
                    **p,
                    "fuente": f"proveedor_{p.get('supplier', {}).get('name', 'proveedor')}",
                    "disponible": False,  # hay que pedirlo al proveedor
                    "supplier_id": p.get("supplier", {}).get("id"),
                })

            return json.dumps(combinados[:15], ensure_ascii=False)

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
