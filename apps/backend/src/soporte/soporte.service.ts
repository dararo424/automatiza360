import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

const SYSTEM_PROMPT = `Eres un agente de soporte de Automatiza360, una plataforma SaaS para pequeñas empresas.
Automatiza360 ayuda a restaurantes, tiendas de tecnología, clínicas y salones de belleza a gestionar pedidos, inventario, reparaciones, citas y comunicación con clientes por WhatsApp.

Tu función es resolver dudas y problemas de los usuarios (dueños de negocio) de forma clara y en español.

Áreas que puedes ayudar:
- Cómo usar el dashboard, órdenes, tickets, agenda, productos, inventario
- Configuración de WhatsApp y bot de atención
- Planes y suscripciones (STARTER, PRO, BUSINESS)
- Configuración del negocio y usuarios del equipo
- Integraciones y exportación de datos

Reglas:
- Responde siempre en español, de forma amable y concisa.
- Si no puedes resolver el problema después de 2-3 intentos, incluye exactamente la frase "[ESCALAR]" en tu respuesta para indicar que un agente humano debe tomar el caso.
- No inventes funcionalidades que no existen.
- Si el usuario pregunta algo técnico muy específico de código o infraestructura, indica que debe contactar al equipo técnico.`;

@Injectable()
export class SoporteService {
  private readonly logger = new Logger(SoporteService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly notificaciones: NotificacionesService) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async responderMensaje(
    tenantId: string,
    mensaje: string,
    historial: { role: string; content: string }[] = [],
  ): Promise<{ respuesta: string; resolved: boolean }> {
    const messages: Anthropic.MessageParam[] = [
      ...historial.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: mensaje },
    ];

    let respuesta = '';

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      });

      const block = response.content[0];
      respuesta = block.type === 'text' ? block.text : '';
    } catch (err: any) {
      this.logger.error('Error calling Anthropic API: %s', err?.message ?? err);
      respuesta = 'Lo siento, no pude procesar tu consulta en este momento. Por favor intenta de nuevo.';
    }

    const needsEscalation = respuesta.includes('[ESCALAR]');
    const cleanedRespuesta = respuesta.replace('[ESCALAR]', '').trim();

    if (needsEscalation) {
      try {
        await this.notificaciones.crear({
          type: 'SOPORTE',
          title: 'Chat de soporte escalado',
          message: mensaje,
          tenantId,
        });
      } catch (err) {
        this.logger.error('Error creating escalation notification', err);
      }
    }

    return {
      respuesta: cleanedRespuesta,
      resolved: !needsEscalation,
    };
  }
}
