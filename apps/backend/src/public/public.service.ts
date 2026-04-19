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
    const prompt = `Eres un consultor experto en automatización para negocios latinoamericanos.
Un prospecto describió su negocio así:
"""
${description}
"""

Analiza la descripción y devuelve UN ÚNICO objeto JSON válido (sin markdown, sin explicaciones extras):
{
  "industry": "<RESTAURANT | BAKERY | TECH_STORE | WORKSHOP | CLINIC | BEAUTY | VETERINARY | CLOTHING_STORE | GYM | PHARMACY | HOTEL | OTHER>",
  "industryLabel": "<nombre amigable en español>",
  "industryEmoji": "<emoji>",
  "recommendedPlan": "<STARTER | PRO | BUSINESS>",
  "planReason": "<1 oración directa sobre por qué ese plan, máx 15 palabras>",
  "planWhyPoints": [
    "<razón específica 1 basada en la descripción del negocio, ej: 'Atiendes múltiples servicios que se benefician de agenda automatizada'>",
    "<razón específica 2, ej: 'El volumen de consultas por precios justifica respuestas 24/7'>",
    "<razón específica 3, ej: 'Con 3 estilistas necesitas gestión de disponibilidad en tiempo real'>"
  ],
  "automations": [
    "<automatización WhatsApp concreta para su negocio>",
    "<automatización 2>",
    "<automatización 3>",
    "<automatización 4>"
  ],
  "headline": "<frase 8-12 palabras sobre el valor para su negocio específico>",
  "description": "<2 oraciones con valor concreto para su tipo de negocio>"
}

Reglas plan:
- STARTER: 1 persona / negocio pequeño / empezando
- PRO: varios empleados / flujo medio / múltiples servicios
- BUSINESS: cadena / sucursales / alto volumen / necesita API

Los planWhyPoints DEBEN ser específicos al negocio descrito, no genéricos.
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
