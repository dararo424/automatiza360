"""
Gemini conversational agent.

Uses the google-genai SDK (v1+) with a manual function-calling loop.
Conversation history is stored in the caller's session dict so context is
preserved across WhatsApp messages (in-memory; survives for the lifetime of
the process — replace with Redis for multi-instance deployments).
"""

from __future__ import annotations

import asyncio
import logging
import os

from google import genai
from google.genai import types

from app.tools import ALL_TOOLS, execute_tool

logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
_STORE_NAME: str = ""          # set by main.py lifespan after backend login

_MODEL_NAME = "gemini-2.5-flash"
MAX_HISTORY = 20               # Content entries to keep (≈ 10 conversation turns)
MAX_TOOL_ITERATIONS = 6        # guard against infinite tool-call loops

# ── System prompt ──────────────────────────────────────────────────────────────

def _build_system_prompt(store_name: str) -> str:
    return f"""Eres el asistente inteligente de {store_name}, una tienda de tecnología.
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

## Reparaciones
- Para consultar estado → llama a ver_reparacion (si tiene número) o ver_mis_reparaciones.
- Para registrar una reparación nueva → recopila: nombre completo, modelo exacto del
  dispositivo y descripción del problema. Luego llama a registrar_reparacion.

## Reglas
- Responde SIEMPRE en español, de forma amable, breve y clara.
- Mensajes cortos y directos — el cliente los lee en WhatsApp.
- Si no tienes información o hay un error, dilo honestamente y ofrece ayuda alternativa.
- NUNCA inventes datos de productos, stock ni precios fuera del inventario real."""


# ── Client singleton ────────────────────────────────────────────────────────────

_client: genai.Client | None = None
_chat_config: types.GenerateContentConfig | None = None


def set_store_name(name: str) -> None:
    """Called from main.py lifespan after fetching tenant info from the backend."""
    global _STORE_NAME, _client, _chat_config
    _STORE_NAME = name
    _client = None        # force rebuild with new store name
    _chat_config = None


def _get_client() -> tuple[genai.Client, types.GenerateContentConfig]:
    global _client, _chat_config
    if _client is not None:
        return _client, _chat_config  # type: ignore[return-value]

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is not set. "
            "Get a key at https://aistudio.google.com/apikey"
        )

    store = _STORE_NAME or os.getenv("BOT_STORE_NAME", "nuestra tienda")
    _client = genai.Client(api_key=GEMINI_API_KEY)
    _chat_config = types.GenerateContentConfig(
        system_instruction=_build_system_prompt(store),
        tools=ALL_TOOLS,
        # Disable automatic function calling — we drive the loop manually so we
        # can execute tools asynchronously and inject the phone context.
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )
    logger.info("Gemini client initialised for store: %s", store)
    return _client, _chat_config


# ── Agentic loop ───────────────────────────────────────────────────────────────

async def run(phone: str, text: str, session: dict) -> str:
    """
    Process one WhatsApp message through the Gemini agent.

    Runs the full function-calling loop:
      user message → Gemini → [tool calls → tool results →]* final text

    Updates session["history"] so follow-up messages retain context.
    """
    client, config = _get_client()
    history: list = session.get("history", [])

    chat = client.aio.chats.create(
        model=_MODEL_NAME,
        history=history,
        config=config,
    )
    response = await chat.send_message(text)

    for iteration in range(MAX_TOOL_ITERATIONS):
        # Collect function calls from this response
        parts = response.candidates[0].content.parts if response.candidates else []
        fn_calls = [
            part.function_call
            for part in parts
            if part.function_call and part.function_call.name
        ]

        if not fn_calls:
            break   # Gemini produced a text response — we're done

        logger.info(
            "Turn %d: Gemini requested %d tool(s): %s",
            iteration + 1,
            len(fn_calls),
            [fc.name for fc in fn_calls],
        )

        # Execute all tool calls concurrently
        results = await asyncio.gather(
            *[execute_tool(fc.name, dict(fc.args), phone) for fc in fn_calls]
        )

        # Return results to Gemini
        fn_response_parts = [
            types.Part.from_function_response(
                name=fc.name,
                response={"result": result},
            )
            for fc, result in zip(fn_calls, results)
        ]
        response = await chat.send_message(fn_response_parts)

    # Persist conversation history (bounded to avoid unbounded memory growth)
    session["history"] = chat.get_history()[-MAX_HISTORY:]

    reply = response.text
    if not reply:
        logger.warning("Gemini returned no text (phone=%s)", phone)
        reply = "Lo siento, no pude procesar tu mensaje en este momento. Intenta de nuevo."

    return reply
