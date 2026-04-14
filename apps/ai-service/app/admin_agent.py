"""
Admin agent for WhatsApp Admin Mode.

When an OWNER/ADMIN/STAFF writes to the business WhatsApp number, this agent
handles the conversation instead of the customer-facing Gemini agent.
Uses Claude (Anthropic) for the agentic loop.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone, timedelta

import anthropic

from app.admin_tools import execute_admin_tool, get_admin_tools

logger = logging.getLogger(__name__)

# Zona horaria Colombia = UTC-5
_colombia_offset = timezone(timedelta(hours=-5))


def _now_colombia() -> datetime:
    return datetime.now(_colombia_offset)


def _build_admin_prompt(industry: str, role: str, media_url: str | None) -> str:
    now = _now_colombia()
    fecha_actual = now.strftime("%A %d de %B de %Y")
    hora_actual = now.strftime("%H:%M")

    base = f"""Hoy es {fecha_actual}, hora actual: {hora_actual} (hora Colombia).

Eres el asistente de administración interno de Automatiza360.
Estás hablando con un {role} del negocio — NO con un cliente externo.
Tu trabajo es ayudar al administrador a gestionar su negocio desde WhatsApp.

REGLAS:
- Responde siempre en español, de forma concisa y clara.
- Confirma cada acción antes de ejecutarla si tiene impacto irreversible (ej: cancelar citas).
- Cuando el admin mande una foto (media_url), úsala según el contexto: adjuntar a un ticket, etc.
- Si el admin pide el resumen del día, usa la herramienta resumen_dia.
- Sé proactivo: si cancelas citas, ofrece al admin la lista de clientes para contactarlos.
- Mensajes cortos y directos — el admin los lee en WhatsApp.
"""

    upper = (industry or "").upper()

    if upper in ("RESTAURANT", "BAKERY"):
        base += """
CAPACIDADES PARA RESTAURANTE:
- Cargar menú del día: "el menú de hoy es: Bandeja paisa $18.000, Sancocho $15.000"
- Ver órdenes pendientes del día
- Resumen del día (total ventas, órdenes pendientes, ingresos)
"""
    elif upper in ("TECH_STORE", "WORKSHOP"):
        base += """
CAPACIDADES PARA TIENDA TECH / TALLER:
- Buscar ticket por nombre de cliente
- Cambiar estado de ticket (RECEIVED, DIAGNOSING, WAITING_PARTS, REPAIRING, READY, DELIVERED, CANCELLED)
- Adjuntar foto a un ticket cuando el admin manda una imagen
- Resumen del día (tickets abiertos, cerrados hoy, ingresos)
"""
    elif upper in ("CLINIC", "BEAUTY", "VETERINARY"):
        base += """
CAPACIDADES PARA CLÍNICA / SALÓN / VETERINARIA:
- Ver resumen del día (citas, completadas, pendientes)
- Cancelar citas en un rango horario y obtener lista de clientes afectados para notificarlos
"""
    elif upper == "CLOTHING_STORE":
        base += """
CAPACIDADES PARA TIENDA DE ROPA:
- Agregar producto nuevo o actualizar uno existente: nombre, precio, stock, descripción
- Actualizar precio de un producto por nombre
- Actualizar stock de un producto por nombre
- Eliminar (desactivar) un producto por nombre
- Resumen del día (órdenes, productos con stock bajo)
"""
    else:
        base += """
CAPACIDADES GENERALES:
- Resumen del día
"""

    if media_url:
        base += f"\nEl administrador acaba de enviar una imagen. URL: {media_url}\nSi es relevante para un ticket, ofrece adjuntarla."

    return base


async def run_admin(
    phone: str,
    text: str,
    media_url: str | None,
    session: list,
    client,
    owner_phone: str,
    admin_info: dict,
) -> str:
    """
    Process one WhatsApp message from an admin through the Claude agent.

    Args:
        phone:       Raw Twilio From value (e.g. 'whatsapp:+521234567890').
        text:        Incoming message text.
        media_url:   Twilio MediaUrl0 if the admin sent an image (or None).
        session:     Per-conversation message history list (mutated in-place).
        client:      BackendClient for the tenant.
        owner_phone: Owner phone (not used here but kept for signature parity).
        admin_info:  Dict from /admin-bot/check/:phone — includes tenantId, role, industry.
    """
    industry = admin_info.get("industry", "OTHER")
    tenant_id = admin_info.get("tenantId", "")
    role = admin_info.get("role", "STAFF")

    system_prompt = _build_admin_prompt(industry, role, media_url)
    tools = get_admin_tools(industry)

    # Build user content
    user_content = text or ""
    if media_url:
        user_content += f"\n[Imagen adjunta: {media_url}]"

    session.append({"role": "user", "content": user_content})

    ai_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

    # Agentic loop
    max_iterations = 6
    for _ in range(max_iterations):
        response = ai_client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1024,
            system=system_prompt,
            messages=session,
            tools=tools,
        )

        if response.stop_reason == "tool_use":
            tool_results = []
            assistant_content = [
                block.model_dump() if hasattr(block, "model_dump") else block
                for block in response.content
            ]
            session.append({"role": "assistant", "content": assistant_content})

            for block in response.content:
                if block.type == "tool_use":
                    result = await execute_admin_tool(
                        block.name,
                        block.input,
                        phone,
                        client,
                        tenant_id,
                        media_url,
                    )
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result),
                    })

            session.append({"role": "user", "content": tool_results})
        else:
            # Final text response
            final_text = next(
                (b.text for b in response.content if hasattr(b, "text")),
                "No pude procesar tu solicitud en este momento.",
            )
            session.append({"role": "assistant", "content": final_text})
            return final_text

    return "Se alcanzó el límite de iteraciones. Por favor intenta de nuevo."
