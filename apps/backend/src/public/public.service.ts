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
    const prompt = `Eres un consultor honesto de automatización para negocios latinoamericanos. Tu trabajo es recomendar el plan MÁS ADECUADO, no el más caro.

El prospecto describió su negocio así:
"""
${description}
"""

PASO 1 — Detecta señales clave en la descripción:
- ¿Trabaja solo / es independiente / a domicilio / freelancer / emprendedor individual? → STARTER
- ¿Menciona empleados, equipo, sucursales, alto volumen? → evalúa PRO o BUSINESS
- ¿Está empezando, es pequeño, tiene pocos clientes? → STARTER
- ¿Tiene múltiples servicios Y varios empleados Y flujo constante? → PRO
- ¿Tiene cadena, franquicia, múltiples locales o necesita integración con sistema propio? → BUSINESS

REGLAS ESTRICTAS DE PLAN (aplica la primera que coincida):
1. STARTER: trabaja solo O negocio unipersonal O a domicilio O "empezando" O menos de 3 empleados O volumen bajo
2. PRO: 3+ empleados Y múltiples servicios Y flujo medio-alto de clientes
3. BUSINESS: cadena/franquicia O múltiples sucursales O +50 clientes/día O necesita API/integración

IMPORTANTE: La mayoría de negocios pequeños latinoamericanos son STARTER. Solo asigna PRO si hay evidencia clara de equipo y volumen. BUSINESS es raro.

PASO 2 — Devuelve UN ÚNICO objeto JSON válido (sin markdown):
{
  "industry": "<RESTAURANT | BAKERY | TECH_STORE | WORKSHOP | CLINIC | BEAUTY | VETERINARY | CLOTHING_STORE | GYM | PHARMACY | HOTEL | OTHER>",
  "industryLabel": "<nombre amigable en español>",
  "industryEmoji": "<emoji>",
  "recommendedPlan": "<STARTER | PRO | BUSINESS>",
  "planReason": "<1 oración directa mencionando algo específico del negocio descrito, máx 15 palabras>",
  "planWhyPoints": [
    "<razón que mencione un detalle CONCRETO de su descripción, ej: 'Como peluquero a domicilio, WhatsApp es tu único canal de ventas'>",
    "<razón sobre su situación específica, ej: 'Trabajas solo, por lo que no necesitas gestión de múltiples agendas'>",
    "<razón sobre el valor real para su caso, ej: 'Con Starter automatizas citas sin pagar por funciones que no usarás'>"
  ],
  "automations": [
    "<automatización WhatsApp MUY concreta para su negocio y plan recomendado>",
    "<automatización 2>",
    "<automatización 3>",
    "<automatización 4>"
  ],
  "headline": "<frase 8-12 palabras sobre el valor para su negocio específico>",
  "description": "<2 oraciones con valor concreto para su tipo de negocio y situación>"
}

Los planWhyPoints DEBEN mencionar detalles literales de la descripción del prospecto. Nunca uses frases genéricas como "tu negocio tiene múltiples servicios" si eso no está en la descripción.
Responde SOLO con el JSON.`;

    try {
      const response = await this.ai.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 700,
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
