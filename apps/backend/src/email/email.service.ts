import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.SMTP_FROM ?? 'Automatiza360 <onboarding@resend.dev>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service configured via Resend');
    } else {
      this.logger.warn('RESEND_API_KEY not configured — emails will be skipped');
    }
  }

  async send(payload: EmailPayload): Promise<void> {
    if (!this.resend) return;
    try {
      await this.resend.emails.send({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      this.logger.log(`Email sent to ${payload.to}: ${payload.subject}`);
    } catch (err) {
      this.logger.error(`Email send failed: ${(err as Error).message}`);
    }
  }

  async enviarRecuperacionContrasena(email: string, nombre: string, resetUrl: string) {
    await this.send({
      to: email,
      subject: 'Recupera tu contraseña — Automatiza360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Automatiza360</h1>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #0f172a; margin-top: 0;">Hola ${nombre},</h2>
            <p style="color: #475569; line-height: 1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en Automatiza360.</p>
            <p style="color: #475569; line-height: 1.6;">Haz clic en el botón para crear una nueva contraseña. Este enlace expira en <strong>1 hora</strong>.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Restablecer contraseña
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 Automatiza360 · Todos los derechos reservados</p>
          </div>
        </div>
      `,
    });
  }

  async enviarBienvenida(email: string, nombre: string, tenantName: string, loginUrl: string) {
    await this.send({
      to: email,
      subject: `¡Bienvenido a Automatiza360, ${nombre}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Automatiza360</h1>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #0f172a; margin-top: 0;">¡Bienvenido, ${nombre}! 🎉</h2>
            <p style="color: #475569; line-height: 1.6;">Tu negocio <strong>${tenantName}</strong> ya está registrado en Automatiza360. Tienes <strong>14 días de prueba gratuita</strong>.</p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #0f172a; margin-top: 0;">¿Por dónde empezar?</h3>
              <ul style="color: #475569; line-height: 2; padding-left: 20px;">
                <li>Configura tu perfil de negocio</li>
                <li>Activa tu bot de WhatsApp</li>
                <li>Agrega tus productos o servicios</li>
                <li>Invita a tu equipo</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Ir a mi panel
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px; text-align: center;">¿Tienes dudas? Escríbenos a <a href="mailto:soporteautomatiza360@rgytgroup.com" style="color: #4f46e5;">soporteautomatiza360@rgytgroup.com</a></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 Automatiza360 · Todos los derechos reservados</p>
          </div>
        </div>
      `,
    });
  }

  async send_nueva_orden(to: string, opts: { storeName: string; orderNumber: number; total: number; clientPhone?: string }) {
    await this.send({
      to,
      subject: `Nueva orden #${opts.orderNumber} — ${opts.storeName}`,
      html: `
        <h2>🍽️ Nueva orden recibida</h2>
        <p><strong>Tienda:</strong> ${opts.storeName}</p>
        <p><strong>Orden #:</strong> ${opts.orderNumber}</p>
        <p><strong>Total:</strong> $${opts.total.toLocaleString('es-CO')} COP</p>
        ${opts.clientPhone ? `<p><strong>Cliente:</strong> ${opts.clientPhone}</p>` : ''}
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
        <a href="${process.env.FRONTEND_URL ?? 'https://automatiza360-frontend.vercel.app'}/planes"
           style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          Ver planes →
        </a>
      `,
    });
  }
}
