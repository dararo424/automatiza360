import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

export interface BusinessAnalysis {
  industry: string;
  industryLabel: string;
  industryEmoji: string;
  recommendedPlan: 'STARTER' | 'PRO' | 'BUSINESS';
  planReason: string;
  automations: string[];
  headline: string;
  description: string;
}

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);
  private readonly ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async analyzeBusiness(description: string): Promise<BusinessAnalysis> {
    const prompt = `Eres un consultor experto en automatización para negocios latinoamericanos.
Un prospecto describió su negocio así:
"""
${description}
"""

Analiza la descripción y devuelve UN ÚNICO objeto JSON válido (sin markdown, sin explicaciones extras) con esta estructura exacta:
{
  "industry": "<uno de: RESTAURANT, BAKERY, TECH_STORE, WORKSHOP, CLINIC, BEAUTY, VETERINARY, CLOTHING_STORE, GYM, PHARMACY, HOTEL, OTHER>",
  "industryLabel": "<nombre amigable en español, ej: Restaurante / Café>",
  "industryEmoji": "<emoji representativo>",
  "recommendedPlan": "<STARTER | PRO | BUSINESS>",
  "planReason": "<1 oración explicando por qué ese plan, máximo 20 palabras>",
  "automations": [
    "<automatización WhatsApp específica para su negocio, ej: Tomar pedidos por WhatsApp 24/7>",
    "<automatización 2>",
    "<automatización 3>",
    "<automatización 4>"
  ],
  "headline": "<frase de 8-12 palabras sobre cómo automatiza360 transformaría su negocio>",
  "description": "<2 oraciones explicando el valor concreto para su tipo de negocio>"
}

Reglas de selección de plan:
- STARTER: negocio pequeño, 1 persona o pocas, o que recién empieza
- PRO: negocio mediano con varios empleados o flujo medio de clientes
- BUSINESS: cadena, múltiples sucursales, alto volumen o necesidad de API

Responde SOLO con el JSON, sin texto adicional.`;

    try {
      const response = await this.ai.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
      return JSON.parse(text) as BusinessAnalysis;
    } catch (err) {
      this.logger.error('Business analysis failed', err);
      return {
        industry: 'OTHER',
        industryLabel: 'Negocio',
        industryEmoji: '🏪',
        recommendedPlan: 'PRO',
        planReason: 'Ideal para la mayoría de negocios en crecimiento',
        automations: [
          'Responder clientes 24/7 por WhatsApp',
          'Gestionar pedidos o reservas automáticamente',
          'Enviar notificaciones de seguimiento',
          'Dashboard para ver métricas en tiempo real',
        ],
        headline: 'Automatiza tu negocio desde WhatsApp hoy mismo',
        description:
          'Con Automatiza360 puedes gestionar toda la operación de tu negocio desde WhatsApp. Ahorra tiempo y aumenta ventas desde el primer día.',
      };
    }
  }
}
