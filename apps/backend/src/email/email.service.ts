import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT ?? '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
      this.logger.log(`Email service configured: ${host}`);
    } else {
      this.logger.warn('SMTP not configured — emails will be skipped');
    }
  }

  async send(payload: EmailPayload): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      this.logger.log(`Email sent to ${payload.to}: ${payload.subject}`);
    } catch (err) {
      this.logger.error(`Email send failed: ${(err as Error).message}`);
    }
  }

  // ── Plantillas ──────────────────────────────────────────────────────────────

  async sendNuevaOrden(to: string, opts: { storeName: string; orderNumber: number; total: number; clientPhone?: string }) {
    await this.send({
      to,
      subject: `Nueva orden #${opts.orderNumber} — ${opts.storeName}`,
      html: `
        <h2>🍽️ Nueva orden recibida</h2>
        <p><strong>Tienda:</strong> ${opts.storeName}</p>
        <p><strong>Orden #:</strong> ${opts.orderNumber}</p>
        <p><strong>Total:</strong> $${opts.total.toLocaleString('es-CO')} COP</p>
        ${opts.clientPhone ? `<p><strong>Cliente:</strong> ${opts.clientPhone}</p>` : ''}
        <p>Revisa el detalle en tu panel de Automatiza360.</p>
      `,
    });
  }

  async sendNuevaCita(to: string, opts: { storeName: string; clientName: string; serviceName: string; date: Date }) {
    const fecha = opts.date.toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'full', timeStyle: 'short' });
    await this.send({
      to,
      subject: `Nueva cita agendada — ${opts.storeName}`,
      html: `
        <h2>📅 Nueva cita agendada por el bot</h2>
        <p><strong>Cliente:</strong> ${opts.clientName}</p>
        <p><strong>Servicio:</strong> ${opts.serviceName}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p>Revisa tu agenda en Automatiza360.</p>
      `,
    });
  }

  async sendTrialExpirando(to: string, opts: { storeName: string; daysRemaining: number }) {
    await this.send({
      to,
      subject: `Tu trial vence en ${opts.daysRemaining} día${opts.daysRemaining !== 1 ? 's' : ''} — Automatiza360`,
      html: `
        <h2>⏰ Tu período de prueba está por vencer</h2>
        <p>Hola ${opts.storeName},</p>
        <p>Tu trial gratuito vence en <strong>${opts.daysRemaining} día${opts.daysRemaining !== 1 ? 's' : ''}</strong>.</p>
        <p>Para continuar usando Automatiza360 sin interrupciones, activa tu plan hoy.</p>
        <a href="${process.env.FRONTEND_URL ?? 'https://app.automatiza360.com'}/planes"
           style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          Ver planes →
        </a>
      `,
    });
  }

  async sendEscalacion(to: string, opts: { storeName: string; clientPhone: string; lastMessage: string }) {
    await this.send({
      to,
      subject: `⚠️ Cliente requiere atención humana — ${opts.storeName}`,
      html: `
        <h2>⚠️ Un cliente necesita atención</h2>
        <p><strong>Tienda:</strong> ${opts.storeName}</p>
        <p><strong>Cliente:</strong> ${opts.clientPhone}</p>
        <p><strong>Último mensaje:</strong> "${opts.lastMessage}"</p>
        <p>El bot no pudo resolver la solicitud. Revisa la bandeja de conversaciones.</p>
        <a href="${process.env.FRONTEND_URL ?? 'https://app.automatiza360.com'}/conversaciones"
           style="background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          Ver conversación →
        </a>
      `,
    });
  }
}
