import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import type { Industry, Plan } from '@prisma/client';

export interface BusinessAnalysis {
  industry: string;
  industryLabel: string;
  industryEmoji: string;
  recommendedPlan: 'STARTER' | 'PRO' | 'BUSINESS';
  planReason: string;
  planWhyPoints: string[];
  automations: string[];
  headline: string;
  description: string;
}

export interface AutoOnboardDto {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  ownerPhone: string;
  industry: Industry;
  plan: Plan;
  description?: string;
}

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);
  private readonly ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async analyzeBusiness(description: string): Promise<BusinessAnalysis> {
    const prompt = `Eres un consultor honesto de automatización para negocios latinoamericanos.

El prospecto describió su negocio así:
"""
${description}
"""

PASO 1 — Estima el volumen mensual de mensajes de WhatsApp que recibiría este negocio.
Piensa: ¿cuántos clientes potenciales contactan este tipo de negocio por mes? ¿Con qué frecuencia pregunta cada cliente? ¿Es un negocio de consulta frecuente o esporádica?

Ejemplos de referencia:
- Peluquero, electricista, profe particular, servicio a domicilio → 50-200 msg/mes → STARTER
- Restaurante pequeño, tienda de ropa, salón de belleza con 2-3 empleados → 200-600 msg/mes → puede ser STARTER o PRO según lo que describa
- Tienda establecida con catálogo amplio, clínica con varios doctores, gimnasio con membresías → 600-2000 msg/mes → PRO
- Cadena, franquicia, varios locales, alto volumen diario → +2000 msg/mes → BUSINESS

REGLA DE PLAN basada en volumen estimado:
- STARTER: menos de 500 mensajes/mes estimados
- PRO: entre 500 y 2000 mensajes/mes estimados
- BUSINESS: más de 2000 mensajes/mes O múltiples sucursales O necesita integración con sistema propio

PASO 2 — Con base en ese análisis, construye los planWhyPoints explicando:
1. Por qué ese tipo de negocio genera ese volumen de mensajes (razona desde la descripción)
2. Por qué ese volumen encaja con el plan recomendado
3. Qué perdería o pagaría de más si eligiera otro plan

Los planWhyPoints NO pueden ser frases genéricas. Deben nombrar el tipo de negocio, el contexto y el volumen estimado.

PASO 3 — Devuelve UN ÚNICO objeto JSON válido (sin markdown, sin texto extra):
{
  "industry": "<RESTAURANT | BAKERY | TECH_STORE | WORKSHOP | CLINIC | BEAUTY | VETERINARY | CLOTHING_STORE | GYM | PHARMACY | HOTEL | OTHER>",
  "industryLabel": "<nombre amigable en español>",
  "industryEmoji": "<emoji>",
  "recommendedPlan": "<STARTER | PRO | BUSINESS>",
  "planReason": "<1 oración directa que mencione el volumen estimado y el tipo de negocio, máx 15 palabras>",
  "planWhyPoints": [
    "<razón 1: explica el volumen estimado basándote en cómo opera este negocio específico>",
    "<razón 2: conecta ese volumen con el límite del plan recomendado>",
    "<razón 3: explica qué gana eligiendo este plan y no uno más caro o más barato>"
  ],
  "automations": [
    "<automatización WhatsApp concreta y útil para este negocio específico>",
    "<automatización 2>",
    "<automatización 3>",
    "<automatización 4>"
  ],
  "headline": "<frase 8-12 palabras sobre el valor para su tipo de negocio>",
  "description": "<2 oraciones con valor concreto para su situación>"
}

Responde SOLO con el JSON.`;

    try {
      const response = await this.ai.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.content.find((b) => b.type === 'text')?.text ?? '{}';
      // Strip markdown code fences if Claude wraps the JSON
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      return JSON.parse(text) as BusinessAnalysis;
    } catch (err) {
      this.logger.error('Business analysis failed', err);
      return {
        industry: 'OTHER',
        industryLabel: 'Negocio',
        industryEmoji: '🏪',
        recommendedPlan: 'PRO',
        planReason: 'Ideal para la mayoría de negocios en crecimiento',
        planWhyPoints: [
          'Tu negocio tiene múltiples servicios que se benefician de automatización',
          'El volumen de mensajes por WhatsApp justifica respuestas 24/7',
          'Necesitas un dashboard para gestionar la operación desde cualquier lugar',
        ],
        automations: [
          'Responder clientes 24/7 por WhatsApp',
          'Gestionar pedidos o reservas automáticamente',
          'Enviar notificaciones de seguimiento',
          'Dashboard con métricas en tiempo real',
        ],
        headline: 'Automatiza tu negocio desde WhatsApp hoy mismo',
        description:
          'Con Automatiza360 puedes gestionar toda la operación desde WhatsApp. Ahorra tiempo y aumenta ventas desde el primer día.',
      };
    }
  }

  async autoOnboard(dto: AutoOnboardDto) {
    // Reutiliza el flujo de registro existente
    const result = await this.authService.registrarTenant({
      businessName: dto.businessName,
      ownerName: dto.ownerName,
      ownerPhone: dto.ownerPhone,
      industry: dto.industry,
      email: dto.email,
      password: dto.password,
    });

    // Guarda la descripción del negocio en el tenant recién creado
    if (dto.description && result.tenant?.id) {
      await this.prisma.tenant.update({
        where: { id: result.tenant.id },
        data: { descripcion: dto.description },
      });
    }

    return result;
  }
}
