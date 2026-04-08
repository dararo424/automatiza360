"""
Gemini conversational agent — multi-tenant edition.

A single genai.Client is shared (same API key for all tenants).
GenerateContentConfig is cached per bot_email so each tenant gets its own
system prompt + tool set.  The cache is invalidated whenever the tenant's
store_name changes (e.g. first request after startup).

Conversation history is stored in the caller's session dict so context is
preserved across WhatsApp messages (in-memory; replace with Redis for
multi-instance deployments).
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone, timedelta
from google import genai
from google.genai import types

from app.backend_client import BackendClient
from app.tools import execute_tool, get_tools

logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

_MODEL_NAME = "gemini-2.5-flash"
MAX_HISTORY = 20
MAX_TOOL_ITERATIONS = 6

# ── System prompts ─────────────────────────────────────────────────────────────

# Zona horaria Colombia = UTC-5
colombia_offset = timezone(timedelta(hours=-5))
now = datetime.now(colombia_offset)
fecha_actual = now.strftime("%A %d de %B de %Y")
hora_actual = now.strftime("%H:%M")


def _build_system_prompt_tech_store(store_name: str) -> str:
    return f"""Hoy es {fecha_actual}, hora actual: {hora_actual} (hora Colombia).

Eres el asistente inteligente de {store_name}, una tienda de tecnología.
Ayudas a los clientes de forma natural, como lo haría un vendedor experto y un técnico experimentado.

## Asesoría y cotizaciones de productos
Cuando un cliente quiera comprar, cotizar o pedir recomendaciones:
1. SIEMPRE llama a consultar_inventario antes de hacer cualquier recomendación.
   Nunca inventes productos, modelos ni precios.
2. Haz preguntas inteligentes para entender sus necesidades:
   - ¿Para qué lo usarás? (trabajo, gaming, estudio, uso general)
   - ¿Tienes un presupuesto definido?
   - Gaming → ¿Qué juegos? ¿Resolución y FPS objetivo? ¿Monitor incluido?
   - Trabajo → ¿Software especializado? ¿Edición de video/foto/diseño?
   - Estudio → ¿Qué carrera? ¿La escuela exige software específico?
3. Muestra máximo 3-4 opciones reales del inventario, ordenadas por precio.
   Explica brevemente por qué cada una encaja en sus necesidades.
4. Cuando el cliente confirme qué quiere, pide su nombre y llama a generar_cotizacion.

Los resultados de consultar_inventario pueden venir de dos fuentes:
- fuente='inventario_propio' y disponible=true: producto en stock físico, entrega inmediata.
  Puedes generar cotización formal con generar_cotizacion.
- fuente='proveedor_NOMBRE' y disponible=false: producto del catálogo del proveedor NOMBRE,
  no está en stock, hay que solicitarlo. NO uses generar_cotizacion para estos.
  Informa al cliente que se puede conseguir bajo pedido y ofrece contactarlo cuando llegue.

## Reparaciones
- Para consultar estado → llama a ver_reparacion (si tiene número) o ver_mis_reparaciones.
- Para registrar una reparación nueva → recopila: nombre completo, modelo exacto del
  dispositivo y descripción del problema. Luego llama a registrar_reparacion.

## Reglas
- Responde SIEMPRE en español, de forma amable, breve y clara.
- Mensajes cortos y directos — el cliente los lee en WhatsApp.
- Si no tienes información o hay un error, dilo honestamente y ofrece ayuda alternativa.
- NUNCA inventes datos de productos, stock ni precios fuera del inventario real."""


def _build_system_prompt_restaurant(store_name: str, owner_phone: str) -> str:
    owner_note = (
        f"\n\nEl número de la dueña es {owner_phone}. "
        "Si quien escribe es ese número, puede actualizar el menú del día "
        "enviando los platos (nombre, descripción opcional y precio). "
        "En ese caso usa la herramienta actualizar_menu_dia."
        if owner_phone else ""
    )
    return f"""Hoy es {fecha_actual}, hora actual: {hora_actual} (hora Colombia).

Eres el asistente virtual de {store_name}, un restaurante.
Ayudas a los clientes de forma amable y eficiente, como lo haría un mesero experto.

## Carta y menú del día
- SIEMPRE llama a consultar_menu_dia o consultar_menu_carta antes de responder sobre disponibilidad.
  Nunca inventes platos ni precios.
- Si el cliente pregunta qué hay hoy → llama a consultar_menu_dia.
- Si pregunta por platos fijos o la carta → llama a consultar_menu_carta.
- Si no hay menú del día, infórmalo y ofrece la carta permanente.

## Pedidos a domicilio
- Hacemos domicilios en el área general. No hay zonas restringidas.
- El domicilio es GRATIS.
- Si el cliente necesita desechables (cubiertos, servilletas), tienen un costo adicional de $2.000.
- Métodos de pago aceptados: efectivo contra entrega, Nequi, Daviplata, tarjeta en línea.
- Para tomar un pedido necesitas:
  1. Nombre del cliente
  2. Platos que desea (verifica que estén en la carta o menú del día)
  3. Dirección de entrega completa
  4. Método de pago
- Confirma el resumen del pedido con el cliente ANTES de llamar tomar_pedido.
- Después de registrar el pedido, comparte el número de pedido y el total.

## Estado de pedidos
- Cuando el cliente mencione un número de pedido → llama a ver_estado_pedido.

## Cupones de descuento
- Si el cliente menciona un código de descuento o cupón, llama a validar_cupon con el código y el monto del pedido.
- Si el cupón es válido, informa el descuento y aplícalo al total antes de llamar tomar_pedido.
- Si el cupón no es válido, informa amablemente el motivo.

## Reglas
- Responde SIEMPRE en español, de forma amable, breve y clara.
- Mensajes cortos y directos — el cliente los lee en WhatsApp.
- Si no tienes información o hay un error, dilo honestamente.
- NUNCA inventes platos, precios ni disponibilidad fuera de la carta real.{owner_note}"""


def _build_system_prompt_clinic(store_name: str) -> str:
    return f"""Hoy es {fecha_actual}, hora actual: {hora_actual} (hora Colombia).

Eres el asistente virtual de {store_name}, un consultorio médico.
Tu función es ayudar a los pacientes a:
- Agendar, reprogramar y cancelar citas médicas
- Consultar disponibilidad de médicos y especialistas
- Informar sobre los servicios y consultas disponibles

Reglas importantes:
- Saluda con calidez y profesionalismo.
- Antes de agendar, SIEMPRE consulta disponibilidad con _consultar_disponibilidad.
- Pide el nombre completo del paciente para agendar.
- Confirma todos los datos antes de crear la cita: nombre, servicio, profesional, fecha y hora.
- Si el paciente quiere cancelar, muéstrale sus citas primero con _ver_mis_citas.
- No brindes diagnósticos médicos ni recomendaciones de salud.
- Para emergencias, indica que llame al 123 o vaya a urgencias.
- Cuando una cita quede agendada exitosamente, muestra los detalles así:
  ✅ *Cita confirmada*
  📅 [fecha y hora]
  🏥 [nombre del servicio]
  👨‍⚕️ [profesional si aplica]
  Y si la respuesta incluye _calendarMessage, muéstralo al final con el texto:
  "Agrega la cita a tu calendario:"
- Responde siempre en español, de forma clara y cordial.
- Mensajes cortos y directos — el paciente los lee en WhatsApp.

IMPORTANTE — fechas y horas:
- Cuando el paciente diga "11am" o "11:00", esa es hora Colombia (UTC-5).
- Para guardar la cita, convierte SIEMPRE a UTC sumando 5 horas.
  Ejemplo: paciente dice "11am" → campo date = "YYYY-MM-DDT16:00:00.000Z"
- Formato obligatorio: YYYY-MM-DDTHH:MM:00.000Z (UTC)
- NUNCA guardes la hora local directamente sin convertir a UTC."""


def _build_system_prompt_beauty(store_name: str) -> str:
    return f"""Hoy es {fecha_actual}, hora actual: {hora_actual} (hora Colombia).

Eres el asistente virtual de {store_name}, salón de belleza y estética.
Tu función es ayudar a los clientes a:
- Reservar, reprogramar y cancelar citas de servicios de belleza
- Consultar disponibilidad de estilistas y especialistas
- Informar sobre el catálogo de servicios, precios y duración

Reglas importantes:
- Saluda con energía y calidez ✨💅
- Antes de agendar, SIEMPRE consulta disponibilidad con _consultar_disponibilidad.
- Pide el nombre del cliente para la reserva.
- Confirma todos los detalles antes de crear la cita.
- Si el cliente quiere cancelar, muéstrale sus citas activas primero con _ver_mis_citas.
- Menciona el precio y duración del servicio al confirmar.
- Sugiere servicios complementarios cuando sea natural.
- Cuando una cita quede agendada, muestra los detalles así:
  ✅ *¡Reserva confirmada!* ✨
  📅 [fecha y hora]
  💅 [nombre del servicio]
  👩‍🎨 [estilista si aplica]
  Y si la respuesta incluye _calendarMessage, muéstralo con:
  "Agrega tu cita al calendario:"
- Responde siempre en español, de forma amigable y cercana.
- Mensajes cortos y directos — el cliente los lee en WhatsApp.

IMPORTANTE — fechas y horas:
- Cuando el cliente diga "11am" o "11:00", esa es hora Colombia (UTC-5).
- Para guardar la cita, convierte SIEMPRE a UTC sumando 5 horas.
  Ejemplo: cliente dice "11am" → campo date = "YYYY-MM-DDT16:00:00.000Z"
- Formato obligatorio: YYYY-MM-DDTHH:MM:00.000Z (UTC)
- NUNCA guardes la hora local directamente sin convertir a UTC."""


def _build_system_prompt_clothing_store(store_name: str) -> str:
    return f"""Hoy es {fecha_actual}, hora actual: {hora_actual} (hora Colombia).

Eres el asistente virtual de {store_name}, una tienda de ropa y moda.
Ayudas a los clientes de forma amable y estilizada.

## Catálogo y consultas
- Cuando el cliente consulte productos → llama a consultar_inventario antes de responder.
  Nunca inventes prendas, tallas, colores ni precios.
- Muestra las opciones disponibles con tallas y colores reales del inventario.
- Si el cliente pregunta por una talla específica, verifica disponibilidad en el inventario.

## Guía de tallas
Cuando el cliente mencione palabras como "talla", "medida", "qué talla soy", "me queda" o quiera
saber su talla antes de comprar, sigue este flujo:
1. Pídele su altura en centímetros y su peso en kilogramos.
2. Opcionalmente pide la medida de cintura (mejora la precisión).
3. Con esos datos, llama a consultar_talla.
4. Muestra el resultado así:
   - Si confianza es ALTA: "Tu talla es *[TALLA]* ✅"
   - Si confianza es MEDIA o BAJA: incluye la advertencia del resultado.
5. Si hay advertencia en la respuesta, muéstrala al cliente tal cual.

## Pedidos
- Para tomar un pedido necesitas: nombre del cliente, prenda, talla, color y método de entrega.
- Confirma el resumen antes de registrar el pedido con tomar_pedido.

## Reglas
- Responde SIEMPRE en español, de forma amable y cercana.
- Mensajes cortos y directos — el cliente los lee en WhatsApp.
- NUNCA inventes productos, tallas, colores ni precios fuera del inventario real."""


def _build_system_prompt_gym(store_name: str) -> str:
    return f"""Hoy es {fecha_actual}, hora actual: {hora_actual} (hora Colombia).

Eres el asistente virtual de {store_name}, un gimnasio / centro fitness.
Ayudas a los clientes con membresías, clases y horarios.

## Planes y membresías
- Cuando el cliente consulte planes → llama a consultar_inventario para ver las membresías disponibles.
- Explica los beneficios de cada plan y su duración.

## Clases y agenda
- Cuando el cliente quiera reservar una clase → usa las herramientas de citas (_consultar_disponibilidad, _agendar_cita).
- Muestra los horarios disponibles y permite agendar directamente.
- Antes de agendar, SIEMPRE consulta disponibilidad.
- Confirma todos los datos: nombre, clase, fecha y hora.

## Reglas
- Responde SIEMPRE en español, de forma motivadora y cercana.
- Mensajes cortos y directos — el cliente los lee en WhatsApp.
- Si el cliente quiere cancelar una clase, muéstrale sus citas con _ver_mis_citas primero.

IMPORTANTE — fechas y horas:
- Cuando el cliente diga "11am" o "11:00", esa es hora Colombia (UTC-5).
- Para guardar la cita, convierte SIEMPRE a UTC sumando 5 horas.
- Formato obligatorio: YYYY-MM-DDTHH:MM:00.000Z (UTC)
- NUNCA guardes la hora local directamente sin convertir a UTC."""


def _build_system_prompt_pharmacy(store_name: str) -> str:
    return f"""Hoy es {fecha_actual}, hora actual: {hora_actual} (hora Colombia).

Eres el asistente virtual de {store_name}, una farmacia / droguería.
Ayudas a los clientes a encontrar medicamentos y productos de salud.

## Disponibilidad y precios
- Cuando el cliente consulte un medicamento o producto → llama a consultar_inventario antes de responder.
  Nunca inventes productos, precios ni disponibilidad.
- Si el producto está disponible, informa el precio y stock.
- Si no está disponible, informa honestamente y ofrece alternativas si las hay.

## Pedidos
- Para tomar un pedido: nombre del cliente, productos solicitados, cantidad, dirección de entrega.
- Confirma el resumen con el cliente antes de registrar el pedido con tomar_pedido.
- Métodos de pago: efectivo, Nequi, Daviplata.

## Reglas
- Responde SIEMPRE en español, de forma clara y profesional.
- Mensajes cortos y directos — el cliente los lee en WhatsApp.
- NO brindes diagnósticos médicos ni recomendaciones de medicamentos sin receta.
- Para urgencias médicas, indica que llame al 123 o vaya a urgencias.
- NUNCA inventes productos, precios ni disponibilidad fuera del inventario real."""


def _build_system_prompt_hotel(store_name: str) -> str:
    return f"""Hoy es {fecha_actual}, hora actual: {hora_actual} (hora Colombia).

Eres el asistente virtual de {store_name}, un hotel / hostal.
Ayudas a los clientes a consultar disponibilidad y hacer reservas.

## Tipos de habitaciones y disponibilidad
- Cuando el cliente consulte habitaciones → usa _consultar_servicios para ver los tipos disponibles.
- Informa sobre características, capacidad y precios de cada tipo de habitación.

## Reservas
- Cuando el cliente quiera reservar → usa las herramientas de citas (_consultar_disponibilidad, _agendar_cita).
- Para la reserva necesitas: nombre del cliente, tipo de habitación, fecha de llegada, fecha de salida.
- Confirma todos los datos antes de crear la reserva.

## Reglas
- Responde SIEMPRE en español, de forma cordial y profesional.
- Mensajes cortos y directos — el cliente los lee en WhatsApp.
- Si el cliente quiere cancelar, muéstrale sus reservas con _ver_mis_citas.

IMPORTANTE — fechas y horas:
- Cuando el cliente diga una fecha de llegada, está en hora Colombia (UTC-5).
- Para guardar la reserva, convierte SIEMPRE a UTC sumando 5 horas.
- Formato obligatorio: YYYY-MM-DDTHH:MM:00.000Z (UTC)
- NUNCA guardes la hora local directamente sin convertir a UTC."""


def _build_system_prompt(store_name: str, industry: str, owner_phone: str) -> str:
    upper = (industry or "").upper()
    if upper == "RESTAURANT":
        return _build_system_prompt_restaurant(store_name, owner_phone)
    if upper == "BAKERY":
        # Bakery shares restaurant prompt (menu + orders)
        return _build_system_prompt_restaurant(store_name, owner_phone)
    if upper == "CLINIC":
        return _build_system_prompt_clinic(store_name)
    if upper == "BEAUTY":
        return _build_system_prompt_beauty(store_name)
    if upper == "GYM":
        return _build_system_prompt_gym(store_name)
    if upper == "VETERINARY":
        # Veterinary shares clinic prompt (appointment based)
        return _build_system_prompt_clinic(store_name)
    if upper == "HOTEL":
        return _build_system_prompt_hotel(store_name)
    if upper == "CLOTHING_STORE":
        return _build_system_prompt_clothing_store(store_name)
    if upper == "PHARMACY":
        return _build_system_prompt_pharmacy(store_name)
    if upper == "WORKSHOP":
        # Workshop shares tech_store prompt (tickets + diagnostics)
        return _build_system_prompt_tech_store(store_name)
    return _build_system_prompt_tech_store(store_name)


# ── Gemini client + per-tenant config cache ────────────────────────────────────

_gemini_client: genai.Client | None = None

# Keyed by bot_email → (store_name_at_build_time, GenerateContentConfig)
_config_cache: dict[str, tuple[str, types.GenerateContentConfig]] = {}


def _get_gemini_client() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY environment variable is not set. "
                "Get a key at https://aistudio.google.com/apikey"
            )
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    return _gemini_client


def _get_config(backend_client: BackendClient, owner_phone: str) -> types.GenerateContentConfig:
    """
    Return (and cache) the GenerateContentConfig for this tenant.
    Cache is keyed by bot_email; invalidated when store_name changes.
    """
    key = backend_client.bot_email
    store_name = backend_client.store_name or os.getenv("BOT_STORE_NAME", "nuestra tienda")
    industry = backend_client.industry or os.getenv("BOT_INDUSTRY", "TECH_STORE")

    cached = _config_cache.get(key)
    if cached and cached[0] == store_name:
        return cached[1]

    config = types.GenerateContentConfig(
        system_instruction=_build_system_prompt(store_name, industry, owner_phone),
        tools=get_tools(industry),
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )
    _config_cache[key] = (store_name, config)
    logger.info(
        "Gemini config built for %s (store=%r industry=%s)", key, store_name, industry
    )
    return config


# ── Legacy single-tenant helpers (kept for backwards compatibility) ────────────

# These are used by main.py when BOT_STORE_NAME / BOT_INDUSTRY are set via env.
_LEGACY_STORE_NAME: str = ""
_LEGACY_INDUSTRY: str = ""


def set_store_info(name: str, industry: str) -> None:
    """Legacy shim — no-op in multi-tenant mode; store info lives in BackendClient."""
    global _LEGACY_STORE_NAME, _LEGACY_INDUSTRY
    _LEGACY_STORE_NAME = name
    _LEGACY_INDUSTRY = industry


def set_store_name(name: str) -> None:
    set_store_info(name, _LEGACY_INDUSTRY)


# ── History sanitizer ──────────────────────────────────────────────────────────

def _sanitize_history(history: list) -> list:
    """
    Remove trailing function_call turns that lack a paired function_response.
    Gemini requires: function_call must be immediately followed by function_response.
    """
    sanitized = []
    i = 0
    while i < len(history):
        turn = history[i]
        has_fc = any(
            hasattr(p, "function_call") and p.function_call is not None
            for p in (turn.parts or [])
        )
        if has_fc:
            if i + 1 < len(history):
                nxt = history[i + 1]
                has_fr = any(
                    hasattr(p, "function_response") and p.function_response is not None
                    for p in (nxt.parts or [])
                )
                if has_fr:
                    sanitized.extend([turn, nxt])
                    i += 2
                    continue
            i += 1
            continue
        sanitized.append(turn)
        i += 1
    return sanitized


# ── Agentic loop ───────────────────────────────────────────────────────────────

async def run(
    phone: str,
    text: str,
    session: dict,
    client: BackendClient,
    owner_phone: str = "",
) -> str:
    """
    Process one WhatsApp message through the Gemini agent.

    Args:
        phone:       Raw Twilio From value (e.g. 'whatsapp:+521234567890').
        text:        Incoming message text.
        session:     Per-conversation state dict (mutated in-place).
        client:      Authenticated BackendClient for the tenant.
        owner_phone: Restaurant owner's WhatsApp number (optional).
    """
    gemini = _get_gemini_client()
    config = _get_config(client, owner_phone)
    history: list = _sanitize_history(session.get("history", []))

    chat = gemini.aio.chats.create(
        model=_MODEL_NAME,
        history=history,
        config=config,
    )
    response = await chat.send_message(text)

    for iteration in range(MAX_TOOL_ITERATIONS):
        parts = response.candidates[0].content.parts if response.candidates else []
        fn_calls = [
            p.function_call
            for p in parts
            if p.function_call and p.function_call.name
        ]

        if not fn_calls:
            break

        logger.info(
            "Turn %d: Gemini requested %d tool(s): %s (tenant=%s)",
            iteration + 1,
            len(fn_calls),
            [fc.name for fc in fn_calls],
            client.bot_email,
        )

        results = await asyncio.gather(
            *[
                execute_tool(fc.name, dict(fc.args), phone, client, owner_phone)
                for fc in fn_calls
            ]
        )

        fn_response_parts = [
            types.Part.from_function_response(
                name=fc.name,
                response={"result": result},
            )
            for fc, result in zip(fn_calls, results)
        ]
        response = await chat.send_message(fn_response_parts)

    session["history"] = chat.get_history(curated=True)[-MAX_HISTORY:]

    reply = response.text
    if not reply:
        logger.warning("Gemini returned no text (phone=%s tenant=%s)", phone, client.bot_email)
        reply = "Lo siento, no pude procesar tu mensaje en este momento. Intenta de nuevo."

    # Escalation detection: check user message for human-agent request phrases
    escalation_phrases = [
        "hablar con humano",
        "quiero hablar con alguien",
        "agente humano",
        "no entiendo",
        "ayuda humana",
        "hablar con una persona",
        "quiero hablar con una persona",
        "atención humana",
    ]
    text_lower = text.lower()
    needs_escalation = any(phrase in text_lower for phrase in escalation_phrases)

    if needs_escalation:
        clean_phone = phone.replace("whatsapp:", "").strip()
        logger.info("Escalation triggered for phone=%s tenant=%s", clean_phone, client.bot_email)
        await client.escalar_conversacion_por_telefono(clean_phone)

    return reply
