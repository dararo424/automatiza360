"""
Tool declarations and async executors for the Gemini agent.

Each tool is a types.FunctionDeclaration (google-genai SDK v1+) with an
explicit JSON schema.  Actual execution is async and lives in execute_tool(),
which receives a BackendClient instance so it works correctly in multi-tenant
deployments.
"""

from __future__ import annotations

import json
import logging

from google.genai import types

from app.backend_client import BackendClient

logger = logging.getLogger(__name__)


# ── Tech-store tool declarations ───────────────────────────────────────────────

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
                description="Precio máximo. Usa 0 para sin límite de precio.",
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


# ── Restaurant tool declarations ───────────────────────────────────────────────

_consultar_menu_carta = types.FunctionDeclaration(
    name="consultar_menu_carta",
    description=(
        "Consulta la carta permanente del restaurante: platos fijos con sus precios. "
        "SIEMPRE llama esta herramienta antes de responder sobre disponibilidad de platos. "
        "Nunca inventes platos ni precios que no estén en la carta."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={},
        required=[],
    ),
)

_consultar_menu_dia = types.FunctionDeclaration(
    name="consultar_menu_dia",
    description=(
        "Consulta el menú del día de hoy con los platos especiales y sus precios. "
        "Llámala cuando el cliente pregunte por el menú del día, el almuerzo o los especiales de hoy."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={},
        required=[],
    ),
)

_tomar_pedido = types.FunctionDeclaration(
    name="tomar_pedido",
    description=(
        "Registra un pedido a domicilio del cliente. "
        "Llámala SOLO cuando tengas: nombre, dirección de entrega, método de pago y los platos confirmados. "
        "Confirma siempre el resumen del pedido con el cliente antes de llamar esta herramienta."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "nombre_cliente": types.Schema(
                type=types.Type.STRING,
                description="Nombre completo del cliente.",
            ),
            "telefono": types.Schema(
                type=types.Type.STRING,
                description="Número de WhatsApp del cliente (se toma automáticamente del chat).",
            ),
            "items": types.Schema(
                type=types.Type.ARRAY,
                description="Lista de platos pedidos.",
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "nombre_producto": types.Schema(
                            type=types.Type.STRING,
                            description="Nombre exacto del plato tal como aparece en la carta o menú del día.",
                        ),
                        "cantidad": types.Schema(
                            type=types.Type.INTEGER,
                            description="Cantidad de unidades (mínimo 1).",
                        ),
                    },
                    required=["nombre_producto", "cantidad"],
                ),
            ),
            "metodo_pago": types.Schema(
                type=types.Type.STRING,
                description="Método de pago: efectivo, nequi, daviplata o tarjeta.",
                enum=["efectivo", "nequi", "daviplata", "tarjeta"],
            ),
            "direccion_entrega": types.Schema(
                type=types.Type.STRING,
                description="Dirección completa de entrega del pedido.",
            ),
            "notas": types.Schema(
                type=types.Type.STRING,
                description="Instrucciones especiales opcionales (ej: sin cebolla, extra salsa).",
            ),
        },
        required=["nombre_cliente", "items", "metodo_pago", "direccion_entrega"],
    ),
)

_ver_estado_pedido = types.FunctionDeclaration(
    name="ver_estado_pedido",
    description=(
        "Consulta el estado actual de un pedido por su número. "
        "Úsala cuando el cliente mencione su número de pedido."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "numero_pedido": types.Schema(
                type=types.Type.INTEGER,
                description="Número del pedido (ej: 12). Solo el número, sin prefijos.",
            ),
        },
        required=["numero_pedido"],
    ),
)

_actualizar_menu_dia = types.FunctionDeclaration(
    name="actualizar_menu_dia",
    description=(
        "Actualiza el menú del día del restaurante con los platos especiales de hoy. "
        "SOLO disponible para la dueña del restaurante. "
        "Recibe la lista de platos con nombre, descripción opcional y precio."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "platos": types.Schema(
                type=types.Type.ARRAY,
                description="Lista de platos del menú del día.",
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "name": types.Schema(
                            type=types.Type.STRING,
                            description="Nombre del plato.",
                        ),
                        "description": types.Schema(
                            type=types.Type.STRING,
                            description="Descripción o ingredientes del plato (opcional).",
                        ),
                        "price": types.Schema(
                            type=types.Type.NUMBER,
                            description="Precio del plato.",
                        ),
                    },
                    required=["name", "price"],
                ),
            ),
        },
        required=["platos"],
    ),
)


# ── Clinic / Beauty tool declarations ─────────────────────────────────────────

_consultar_servicios_citas = types.FunctionDeclaration(
    name="_consultar_servicios",
    description="Lista todos los servicios disponibles con duración y precio.",
    parameters=types.Schema(type=types.Type.OBJECT, properties={}, required=[]),
)

_consultar_profesionales_citas = types.FunctionDeclaration(
    name="_consultar_profesionales",
    description="Lista los profesionales/doctores/estilistas disponibles con sus horarios.",
    parameters=types.Schema(type=types.Type.OBJECT, properties={}, required=[]),
)

_consultar_disponibilidad_citas = types.FunctionDeclaration(
    name="_consultar_disponibilidad",
    description=(
        "Consulta los horarios disponibles para una fecha. "
        "SIEMPRE consultar disponibilidad ANTES de agendar una cita."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "date": types.Schema(
                type=types.Type.STRING,
                description="Fecha en formato YYYY-MM-DD.",
            ),
            "professional_id": types.Schema(
                type=types.Type.STRING,
                description="ID del profesional (opcional).",
            ),
        },
        required=["date"],
    ),
)

_agendar_cita = types.FunctionDeclaration(
    name="_agendar_cita",
    description=(
        "Agenda una cita para el cliente. "
        "Requiere haber consultado disponibilidad primero. "
        "Confirma todos los datos con el cliente antes de llamar esta herramienta."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "client_name": types.Schema(
                type=types.Type.STRING,
                description="Nombre completo del cliente.",
            ),
            "service_name": types.Schema(
                type=types.Type.STRING,
                description="Nombre exacto del servicio.",
            ),
            "date": types.Schema(
                type=types.Type.STRING,
                description="Fecha y hora en formato YYYY-MM-DDTHH:MM:00.",
            ),
            "professional_name": types.Schema(
                type=types.Type.STRING,
                description="Nombre del profesional (opcional).",
            ),
            "notes": types.Schema(
                type=types.Type.STRING,
                description="Notas adicionales (opcional).",
            ),
        },
        required=["client_name", "service_name", "date"],
    ),
)

_ver_mis_citas = types.FunctionDeclaration(
    name="_ver_mis_citas",
    description="Muestra las citas activas del cliente.",
    parameters=types.Schema(type=types.Type.OBJECT, properties={}, required=[]),
)

_cancelar_cita = types.FunctionDeclaration(
    name="_cancelar_cita",
    description="Cancela una cita existente del cliente.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "appointment_id": types.Schema(
                type=types.Type.STRING,
                description="ID de la cita a cancelar.",
            ),
        },
        required=["appointment_id"],
    ),
)

_registrar_nps = types.FunctionDeclaration(
    name="registrar_nps",
    description=(
        "Registra la respuesta NPS del cliente después de una orden entregada o cita completada. "
        "Úsala cuando el cliente responda a la pregunta de satisfacción con un número del 0 al 10."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "score": types.Schema(
                type=types.Type.INTEGER,
                description="Puntuación del 0 al 10 que dio el cliente.",
            ),
            "comentario": types.Schema(
                type=types.Type.STRING,
                description="Comentario adicional del cliente (opcional).",
            ),
            "tipo": types.Schema(
                type=types.Type.STRING,
                description="Tipo de referencia: 'ORDER' o 'APPOINTMENT'.",
                enum=["ORDER", "APPOINTMENT"],
            ),
            "referencia_id": types.Schema(
                type=types.Type.STRING,
                description="ID de la orden o cita (opcional).",
            ),
        },
        required=["score", "tipo"],
    ),
)

_CLINIC_TOOLS = [
    _consultar_servicios_citas,
    _consultar_profesionales_citas,
    _consultar_disponibilidad_citas,
    _agendar_cita,
    _ver_mis_citas,
    _cancelar_cita,
    _registrar_nps,
]

TOOLS_CLINIC = [types.Tool(function_declarations=_CLINIC_TOOLS)]
TOOLS_BEAUTY = [types.Tool(function_declarations=_CLINIC_TOOLS)]


# ── Tool lists by industry ─────────────────────────────────────────────────────

TOOLS_TECH_STORE = [
    types.Tool(function_declarations=[
        _consultar_inventario,
        _ver_reparacion,
        _ver_mis_reparaciones,
        _registrar_reparacion,
        _generar_cotizacion,
        _registrar_nps,
    ])
]

_validar_cupon = types.FunctionDeclaration(
    name="validar_cupon",
    description=(
        "Valida un cupón de descuento ingresado por el cliente. "
        "Úsala cuando el cliente mencione que tiene un código de descuento o cupón. "
        "Retorna si el cupón es válido y el descuento aplicable."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "codigo": types.Schema(
                type=types.Type.STRING,
                description="Código del cupón tal como lo indica el cliente (en mayúsculas).",
            ),
            "monto": types.Schema(
                type=types.Type.NUMBER,
                description="Monto total del pedido antes del descuento.",
            ),
        },
        required=["codigo", "monto"],
    ),
)

TOOLS_RESTAURANT = [
    types.Tool(function_declarations=[
        _consultar_menu_carta,
        _consultar_menu_dia,
        _tomar_pedido,
        _ver_estado_pedido,
        _actualizar_menu_dia,
        _validar_cupon,
        _registrar_nps,
    ])
]

# ── Clothing store tool declarations ──────────────────────────────────────────

_consultar_talla = types.FunctionDeclaration(
    name="consultar_talla",
    description=(
        "Recomienda la talla de ropa ideal para el cliente según su altura, peso y cintura. "
        "Llama esta herramienta cuando el cliente mencione palabras como 'talla', 'medida', "
        "'me queda', 'qué talla soy' o quiera saber su talla. "
        "Pide altura y peso primero; la cintura es opcional pero mejora la precisión."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "altura": types.Schema(
                type=types.Type.NUMBER,
                description="Altura del cliente en centímetros (ej: 170).",
            ),
            "peso": types.Schema(
                type=types.Type.NUMBER,
                description="Peso del cliente en kilogramos (ej: 65).",
            ),
            "cintura": types.Schema(
                type=types.Type.NUMBER,
                description="Medida de cintura en centímetros (opcional, mejora la precisión).",
            ),
        },
        required=["altura", "peso"],
    ),
)

TOOLS_CLOTHING_STORE = [
    types.Tool(function_declarations=[
        _consultar_inventario,
        _tomar_pedido,
        _consultar_talla,
        _validar_cupon,
        _registrar_nps,
    ])
]

# ── GYM ───────────────────────────────────────────────────────────────────────
TOOLS_GYM = [types.Tool(function_declarations=[
    *_CLINIC_TOOLS,       # clases y sesiones de entrenamiento
    _consultar_inventario, # membresías, suplementos, accesorios
    _validar_cupon,
])]

# ── PHARMACY ──────────────────────────────────────────────────────────────────
TOOLS_PHARMACY = [types.Tool(function_declarations=[
    _consultar_inventario,
    _registrar_nps,
])]

# ── VETERINARY ────────────────────────────────────────────────────────────────
TOOLS_VETERINARY = [types.Tool(function_declarations=[
    *_CLINIC_TOOLS,        # citas veterinarias
    _consultar_inventario, # alimentos, medicamentos, accesorios
])]

# ── HOTEL ─────────────────────────────────────────────────────────────────────
TOOLS_HOTEL = [types.Tool(function_declarations=[
    *_CLINIC_TOOLS,  # reservas de habitaciones
    _registrar_nps,
])]

# ── BAKERY ────────────────────────────────────────────────────────────────────
TOOLS_BAKERY = [types.Tool(function_declarations=[
    _consultar_menu_carta,
    _consultar_menu_dia,
    _tomar_pedido,
    _ver_estado_pedido,
    _validar_cupon,
    _registrar_nps,
])]

# ── WORKSHOP ──────────────────────────────────────────────────────────────────
TOOLS_WORKSHOP = [types.Tool(function_declarations=[
    _consultar_inventario,
    _ver_reparacion,
    _ver_mis_reparaciones,
    _registrar_reparacion,
    _generar_cotizacion,
    _registrar_nps,
])]

# ── OTHER (genérico) ──────────────────────────────────────────────────────────
TOOLS_OTHER = [types.Tool(function_declarations=[
    _consultar_inventario,
    _registrar_nps,
])]

# Legacy alias
ALL_TOOLS = TOOLS_TECH_STORE

_INDUSTRY_TOOLS: dict[str, list[types.Tool]] = {
    "RESTAURANT":     TOOLS_RESTAURANT,
    "CLINIC":         TOOLS_CLINIC,
    "BEAUTY":         TOOLS_BEAUTY,
    "CLOTHING_STORE": TOOLS_CLOTHING_STORE,
    "GYM":            TOOLS_GYM,
    "PHARMACY":       TOOLS_PHARMACY,
    "VETERINARY":     TOOLS_VETERINARY,
    "HOTEL":          TOOLS_HOTEL,
    "BAKERY":         TOOLS_BAKERY,
    "WORKSHOP":       TOOLS_WORKSHOP,
    "TECH_STORE":     TOOLS_TECH_STORE,
    "JEWELRY":        TOOLS_TECH_STORE,
}


def get_tools(industry: str) -> list[types.Tool]:
    """Return the tool list for the given tenant industry string."""
    return _INDUSTRY_TOOLS.get((industry or "").upper(), TOOLS_OTHER)


# ── Async executor ─────────────────────────────────────────────────────────────

async def execute_tool(
    name: str,
    args: dict,
    phone: str,
    client: BackendClient,
    owner_phone: str = "",
) -> str:
    """
    Execute a tool requested by Gemini and return a JSON string with the result.

    Args:
        name:        Tool name as returned by Gemini.
        args:        Tool arguments dict.
        phone:       Raw Twilio From value (e.g. 'whatsapp:+521234567890').
        client:      Authenticated BackendClient for this tenant.
        owner_phone: Restaurant owner's phone (normalized, no prefix). Optional.
    """
    clean_phone = phone.replace("whatsapp:", "").strip()
    logger.info("Tool call: %s  args=%s  tenant=%s", name, args, client.bot_email)

    try:
        # ── Tech-store tools ──────────────────────────────────────────────────
        if name == "consultar_inventario":
            busqueda = str(args.get("busqueda", "")).lower()
            presupuesto = float(args.get("presupuesto_max", 0) or 0)

            if busqueda:
                resultado = await client.buscar_en_proveedores(busqueda)
                propios = resultado.get("propios", [])
                catalogo = resultado.get("catalogo", [])
            else:
                propios = await client.get_productos()
                catalogo = []

            if presupuesto > 0:
                propios = [p for p in propios if p["price"] <= presupuesto]
                catalogo = [p for p in catalogo if p["price"] <= presupuesto]

            combinados = []
            for p in propios[:5]:
                combinados.append({**p, "fuente": "inventario_propio", "disponible": True})
            for p in catalogo[:10]:
                combinados.append({
                    **p,
                    "fuente": f"proveedor_{p.get('supplier', {}).get('name', 'proveedor')}",
                    "disponible": False,
                    "supplier_id": p.get("supplier", {}).get("id"),
                })
            return json.dumps(combinados[:15], ensure_ascii=False)

        if name == "ver_reparacion":
            numero = int(args["numero_ticket"])
            ticket = await client.buscar_ticket_por_numero(numero)
            if not ticket:
                return json.dumps(
                    {"error": f"No se encontró ningún ticket con el número {numero}."},
                    ensure_ascii=False,
                )
            return json.dumps(ticket, ensure_ascii=False)

        if name == "ver_mis_reparaciones":
            tickets = await client.buscar_tickets_por_telefono(phone)
            if not tickets:
                return json.dumps(
                    {"mensaje": "No se encontraron reparaciones para este número de WhatsApp."},
                    ensure_ascii=False,
                )
            return json.dumps(tickets, ensure_ascii=False)

        if name == "registrar_reparacion":
            ticket = await client.crear_ticket({
                "clientName":  args["nombre_cliente"],
                "clientPhone": clean_phone,
                "device":      args["dispositivo"],
                "issue":       args["problema"],
            })
            return json.dumps(ticket, ensure_ascii=False)

        if name == "generar_cotizacion":
            cotizacion = await client.crear_cotizacion({
                "clientName":  args["nombre_cliente"],
                "clientPhone": clean_phone,
                "items": [{
                    "productId": args["product_id"],
                    "quantity":  int(args["cantidad"]),
                }],
            })
            return json.dumps(cotizacion, ensure_ascii=False)

        # ── Restaurant tools ──────────────────────────────────────────────────
        if name == "consultar_menu_carta":
            productos = await client.get_productos()
            return json.dumps(productos, ensure_ascii=False)

        if name == "consultar_menu_dia":
            menu = await client.get_menu_dia()
            if not menu:
                return json.dumps(
                    {"mensaje": "Hoy no hay menú del día disponible. Consulta la carta permanente."},
                    ensure_ascii=False,
                )
            return json.dumps(menu, ensure_ascii=False)

        if name == "tomar_pedido":
            orden = await client.crear_orden_bot({
                "nombre_cliente":    args["nombre_cliente"],
                "telefono":          clean_phone,
                "items":             args["items"],
                "metodo_pago":       args["metodo_pago"],
                "direccion_entrega": args["direccion_entrega"],
                "notas":             args.get("notas"),
            })
            return json.dumps(orden, ensure_ascii=False)

        if name == "ver_estado_pedido":
            numero = int(args["numero_pedido"])
            all_orders: list = await client._request("GET", "/ordenes")
            orden = next((o for o in all_orders if o.get("number") == numero), None)
            if not orden:
                return json.dumps(
                    {"error": f"No se encontró ningún pedido con el número {numero}."},
                    ensure_ascii=False,
                )
            return json.dumps(orden, ensure_ascii=False)

        if name == "actualizar_menu_dia":
            if owner_phone and clean_phone != owner_phone:
                return json.dumps(
                    {"error": "No tienes permiso para actualizar el menú del día."},
                    ensure_ascii=False,
                )
            menu = await client.actualizar_menu_dia(args["platos"])
            return json.dumps(menu, ensure_ascii=False)

        # ── Clinic / Beauty tools ─────────────────────────────────────────────
        if name == "_consultar_servicios":
            result = await client.get_servicios()
            return json.dumps(result, ensure_ascii=False)

        if name == "_consultar_profesionales":
            result = await client.get_profesionales()
            return json.dumps(result, ensure_ascii=False)

        if name == "_consultar_disponibilidad":
            result = await client.get_disponibilidad(
                args["date"],
                args.get("professional_id"),
            )
            return json.dumps(result, ensure_ascii=False)

        if name == "_agendar_cita":
            data = {
                "clientName": args["client_name"],
                "clientPhone": clean_phone,
                "serviceName": args["service_name"],
                "date": args["date"],
            }
            if args.get("professional_name"):
                data["professionalName"] = args["professional_name"]
            if args.get("notes"):
                data["notes"] = args["notes"]
            result = await client.crear_cita(data)
            # Format calendar links for the AI to show to the client
            links = result.get("calendarLinks", {})
            if links:
                result["_calendarMessage"] = (
                    f"📲 Google Calendar: {links.get('googleUrl', '')}\n"
                    f"📅 Outlook: {links.get('outlookUrl', '')}"
                )
            return json.dumps(result, ensure_ascii=False)

        if name == "_ver_mis_citas":
            result = await client.get_citas_cliente(clean_phone)
            return json.dumps(result, ensure_ascii=False)

        if name == "_cancelar_cita":
            result = await client.cancelar_cita(args["appointment_id"], clean_phone)
            return json.dumps(result, ensure_ascii=False)

        if name == "validar_cupon":
            result = await client._request("POST", "/cupones/validar", {
                "codigo": str(args["codigo"]).upper(),
                "monto": float(args.get("monto", 0)),
            })
            return json.dumps(result, ensure_ascii=False)

        if name == "registrar_nps":
            result = await client._request("POST", "/nps/bot", {
                "clientPhone": clean_phone,
                "score": int(args["score"]),
                "comentario": args.get("comentario"),
                "tipo": args.get("tipo", "ORDER"),
                "referenciaId": args.get("referencia_id"),
            })
            return json.dumps(result, ensure_ascii=False)

        # ── Clothing store tools ──────────────────────────────────────────────
        if name == "consultar_talla":
            payload = {
                "clientePhone": clean_phone,
                "altura": float(args["altura"]),
                "peso": float(args["peso"]),
            }
            if args.get("cintura"):
                payload["cintura"] = float(args["cintura"])
            result = await client._request("POST", "/tallas/bot/consultar", payload)
            return json.dumps(result, ensure_ascii=False)

        return json.dumps({"error": f"Herramienta '{name}' no reconocida."})

    except Exception as exc:
        logger.error("Tool %s failed (tenant=%s): %s", name, client.bot_email, exc, exc_info=True)
        return json.dumps({"error": str(exc)}, ensure_ascii=False)
