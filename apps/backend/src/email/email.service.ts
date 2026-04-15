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

  async enviarRecuperacionContrasena(email: string, nombre: string, resetUrl: string) {
    await this.send({
      to: email,
      subject: 'Recupera tu contraseña — Automatiza360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Automatiza360</h1>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
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
    try {
      await this.send({
        to: email,
        subject: `¡Bienvenido a Automatiza360, ${nombre}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
            <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Automatiza360</h1>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color: #0f172a; margin-top: 0;">¡Bienvenido, ${nombre}!</h2>
              <p style="color: #475569; line-height: 1.6;">Tu negocio <strong>${tenantName}</strong> ya está registrado en Automatiza360. Tienes <strong>14 días de prueba gratuita</strong> para explorar todas las funcionalidades.</p>
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
              <p style="color: #94a3b8; font-size: 14px; text-align: center;">¿Tienes dudas? Escríbenos a <a href="mailto:soporte@rgyt.com" style="color: #4f46e5;">soporte@rgyt.com</a></p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 Automatiza360 · Todos los derechos reservados</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Error enviando email de bienvenida:', error);
      // No relanzar — el registro no debe fallar si el email falla
    }
  }

  async sendReporteEjecutivo(
    to: string,
    data: {
      storeName: string;
      semana: string;
      ordenes: number;
      ingresos: number;
      citas: number;
      contactos: number;
      ordenesChange: number;
      ingresosChange: number;
      citasChange: number;
      contactosChange: number;
    },
  ) {
    const fmt = (n: number) => n.toLocaleString('es-CO');
    const fmtCOP = (n: number) => `$${n.toLocaleString('es-CO')} COP`;
    const pct = (n: number) => {
      if (n === 0) return '<span style="color:#64748b">Sin cambio</span>';
      const color = n > 0 ? '#16a34a' : '#dc2626';
      const arrow = n > 0 ? '▲' : '▼';
      return `<span style="color:${color}">${arrow} ${Math.abs(n).toFixed(1)}%</span>`;
    };

    await this.send({
      to,
      subject: `Resumen semanal — ${data.storeName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
          <h1 style="color:#0f172a;font-size:22px;margin-bottom:4px;">Resumen semanal de ${data.storeName}</h1>
          <p style="color:#64748b;font-size:14px;margin-bottom:24px;">${data.semana}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px;">
            <tr>
              <td style="background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Ventas</p>
                <p style="color:#0f172a;font-size:24px;font-weight:bold;margin:0;">${fmt(data.ordenes)}</p>
                <p style="font-size:12px;margin:4px 0 0;">${pct(data.ordenesChange)} vs semana anterior</p>
              </td>
              <td style="background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Ingresos</p>
                <p style="color:#0f172a;font-size:24px;font-weight:bold;margin:0;">${fmtCOP(data.ingresos)}</p>
                <p style="font-size:12px;margin:4px 0 0;">${pct(data.ingresosChange)} vs semana anterior</p>
              </td>
            </tr>
            <tr>
              <td style="background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Citas agendadas</p>
                <p style="color:#0f172a;font-size:24px;font-weight:bold;margin:0;">${fmt(data.citas)}</p>
                <p style="font-size:12px;margin:4px 0 0;">${pct(data.citasChange)} vs semana anterior</p>
              </td>
              <td style="background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Nuevos contactos</p>
                <p style="color:#0f172a;font-size:24px;font-weight:bold;margin:0;">${fmt(data.contactos)}</p>
                <p style="font-size:12px;margin:4px 0 0;">${pct(data.contactosChange)} vs semana anterior</p>
              </td>
            </tr>
          </table>
          <p style="color:#64748b;font-size:12px;margin-top:24px;text-align:center;">
            Automatiza360 &mdash; <a href="${process.env.FRONTEND_URL ?? 'https://app.automatiza360.com'}/dashboard" style="color:#4f46e5;">Ver dashboard</a>
          </p>
        </div>
      `,
    });
  }
}
