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

  async sendActivacionDia1(to: string, opts: { ownerName: string; storeName: string; dashboardUrl: string }) {
    await this.send({
      to,
      subject: `${opts.storeName} — tu bot está listo para activar`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
          <div style="background:#0f172a;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">Automatiza360</h1>
          </div>
          <div style="background:white;padding:32px;border-radius:0 0 12px 12px;">
            <h2 style="color:#0f172a;margin-top:0;">Hola ${opts.ownerName} 👋</h2>
            <p style="color:#475569;line-height:1.6;">Tu cuenta para <strong>${opts.storeName}</strong> ya está lista. Solo te faltan 3 pasos para que tu bot responda solo:</p>
            <div style="margin:24px 0;">
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;">
                <span style="background:#4f46e5;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;text-align:center;line-height:28px;">1</span>
                <div><strong style="color:#0f172a;">Agrega tus productos o servicios</strong><br><span style="color:#64748b;font-size:14px;">El bot los usa para responder preguntas de precio y disponibilidad.</span></div>
              </div>
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;">
                <span style="background:#4f46e5;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;text-align:center;line-height:28px;">2</span>
                <div><strong style="color:#0f172a;">Conecta tu número de WhatsApp</strong><br><span style="color:#64748b;font-size:14px;">Ve a "Mi Plan" y sigue las instrucciones — tarda menos de 2 minutos.</span></div>
              </div>
              <div style="display:flex;align-items:flex-start;gap:12px;">
                <span style="background:#4f46e5;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;text-align:center;line-height:28px;">3</span>
                <div><strong style="color:#0f172a;">Envíate un mensaje de prueba</strong><br><span style="color:#64748b;font-size:14px;">Escribe al número conectado y ve cómo responde el bot en tiempo real.</span></div>
              </div>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="${opts.dashboardUrl}" style="background:#4f46e5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                Activar mi bot ahora →
              </a>
            </div>
            <p style="color:#94a3b8;font-size:13px;text-align:center;">Tienes 13 días restantes de prueba gratuita. Si necesitas ayuda, responde este correo.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;">© 2026 Automatiza360</p>
          </div>
        </div>
      `,
    });
  }

  async sendTrialMidPoint(to: string, opts: { storeName: string; loginUrl: string }) {
    await this.send({
      to,
      subject: `¿Cómo va todo en ${opts.storeName}? — A mitad del trial`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
          <div style="background:#070E1B;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">Automatiza<span style="color:#00C278">360</span></h1>
          </div>
          <div style="background:white;padding:32px;border-radius:0 0 12px 12px;">
            <h2 style="color:#0f172a;margin-top:0;">Ya llevas 7 días con nosotros 🎯</h2>
            <p style="color:#475569;line-height:1.6;">Hola equipo de <strong>${opts.storeName}</strong>, estamos a mitad de tu período de prueba gratuita.</p>
            <p style="color:#475569;line-height:1.6;">¿Sabías que los negocios que configuran estas 3 cosas en el trial convierten <strong>3× más clientes</strong>?</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0;">
              <p style="color:#166534;font-weight:bold;margin:0 0 12px 0;">✅ Lista de activación</p>
              <ul style="color:#475569;line-height:2;padding-left:20px;margin:0;">
                <li>Agrega al menos 5 productos o servicios al catálogo</li>
                <li>Activa el bot de WhatsApp y haz una prueba con tu número</li>
                <li>Configura los horarios de atención del bot</li>
              </ul>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="${opts.loginUrl}" style="background:#00C278;color:#070E1B;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                Ir a completar mi configuración →
              </a>
            </div>
            <p style="color:#94a3b8;font-size:14px;text-align:center;">¿Necesitas ayuda? <a href="mailto:soporteautomatiza360@rgytgroup.com" style="color:#00C278;">soporteautomatiza360@rgytgroup.com</a></p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;">© 2026 Automatiza360 · Todos los derechos reservados</p>
          </div>
        </div>
      `,
    });
  }

  async sendTrialExpirando(to: string, opts: { storeName: string; daysRemaining: number }) {
    const isLastDay = opts.daysRemaining === 1;
    await this.send({
      to,
      subject: isLastDay
        ? `🚨 Último día de trial — ${opts.storeName}`
        : `⚠️ Tu trial vence en ${opts.daysRemaining} días — Automatiza360`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
          <div style="background:#070E1B;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">Automatiza<span style="color:#00C278">360</span></h1>
          </div>
          <div style="background:white;padding:32px;border-radius:0 0 12px 12px;">
            <h2 style="color:#0f172a;margin-top:0;">${isLastDay ? '🚨 Mañana termina tu trial' : `⏰ Te quedan ${opts.daysRemaining} días`}</h2>
            <p style="color:#475569;line-height:1.6;">Hola equipo de <strong>${opts.storeName}</strong>,</p>
            <p style="color:#475569;line-height:1.6;">
              ${isLastDay
                ? 'Tu período de prueba gratuita <strong>vence mañana</strong>. Para no perder acceso a tu bot, tus datos y tus clientes configurados, activa tu plan hoy.'
                : `Tu trial gratuito vence en <strong>${opts.daysRemaining} días</strong>. Activa tu plan para seguir automatizando sin interrupciones.`
              }
            </p>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="color:#9a3412;margin:0;font-size:14px;">Si no activas un plan, tu bot dejará de responder y perderás acceso al dashboard.</p>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="${process.env.FRONTEND_URL ?? 'https://automatiza360-frontend.vercel.app'}/planes"
                 style="background:#00C278;color:#070E1B;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                Activar mi plan ahora →
              </a>
            </div>
            <p style="color:#94a3b8;font-size:14px;text-align:center;">¿Tienes dudas? <a href="mailto:soporteautomatiza360@rgytgroup.com" style="color:#00C278;">soporteautomatiza360@rgytgroup.com</a></p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;">© 2026 Automatiza360 · Todos los derechos reservados</p>
          </div>
        </div>
      `,
    });
  }

  async sendConfirmacionPago(to: string, opts: { ownerName: string; storeName: string; plan: string; monto: number; referencia: string }) {
    const planLabel: Record<string, string> = { STARTER: 'Starter', PRO: 'Pro', BUSINESS: 'Business' };
    const label = planLabel[opts.plan] ?? opts.plan;
    const fmt = (n: number) => `$${n.toLocaleString('es-CO')} COP`;
    await this.send({
      to,
      subject: `✅ Pago confirmado — Plan ${label} activado`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
          <div style="background:#070E1B;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">Automatiza<span style="color:#00C278">360</span></h1>
          </div>
          <div style="background:white;padding:32px;border-radius:0 0 12px 12px;">
            <h2 style="color:#0f172a;margin-top:0;">¡Pago recibido, ${opts.ownerName}! 🎉</h2>
            <p style="color:#475569;line-height:1.6;">Tu suscripción de <strong>${opts.storeName}</strong> al plan <strong>${label}</strong> ha sido activada exitosamente.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0;">
              <p style="color:#166534;font-weight:bold;margin:0 0 12px 0;">Detalles del pago</p>
              <p style="color:#475569;margin:4px 0;">Plan: <strong>${label}</strong></p>
              <p style="color:#475569;margin:4px 0;">Monto: <strong>${fmt(opts.monto)}</strong></p>
              <p style="color:#475569;margin:4px 0;">Referencia: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:13px;">${opts.referencia}</code></p>
              <p style="color:#475569;margin:4px 0;">Vigencia: <strong>1 mes desde hoy</strong></p>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="${process.env.FRONTEND_URL ?? 'https://automatiza360-frontend.vercel.app'}/dashboard"
                 style="background:#00C278;color:#070E1B;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                Ir a mi panel →
              </a>
            </div>
            <p style="color:#94a3b8;font-size:14px;text-align:center;">¿Tienes dudas? <a href="mailto:soporteautomatiza360@rgytgroup.com" style="color:#00C278;">soporteautomatiza360@rgytgroup.com</a></p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;">© 2026 Automatiza360 · Todos los derechos reservados</p>
          </div>
        </div>
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
        <a href="${process.env.FRONTEND_URL ?? 'https://automatiza360-frontend.vercel.app'}/conversaciones"
           style="background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          Ver conversación →
        </a>
      `,
    });
  }

  async sendReporteEjecutivo(to: string, data: {
    storeName: string; semana: string; ordenes: number; ingresos: number;
    citas: number; contactos: number; ordenesChange: number; ingresosChange: number;
    citasChange: number; contactosChange: number;
  }) {
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
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h1 style="color:#0f172a;">Resumen semanal de ${data.storeName}</h1>
          <p style="color:#64748b;">${data.semana}</p>
          <table width="100%" cellpadding="8">
            <tr>
              <td style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
                <p style="color:#64748b;margin:0;">Ventas</p>
                <p style="font-size:24px;font-weight:bold;margin:4px 0;">${fmt(data.ordenes)}</p>
                <p style="margin:0;">${pct(data.ordenesChange)} vs semana anterior</p>
              </td>
              <td style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
                <p style="color:#64748b;margin:0;">Ingresos</p>
                <p style="font-size:24px;font-weight:bold;margin:4px 0;">${fmtCOP(data.ingresos)}</p>
                <p style="margin:0;">${pct(data.ingresosChange)} vs semana anterior</p>
              </td>
            </tr>
            <tr>
              <td style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
                <p style="color:#64748b;margin:0;">Citas</p>
                <p style="font-size:24px;font-weight:bold;margin:4px 0;">${fmt(data.citas)}</p>
                <p style="margin:0;">${pct(data.citasChange)} vs semana anterior</p>
              </td>
              <td style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
                <p style="color:#64748b;margin:0;">Nuevos contactos</p>
                <p style="font-size:24px;font-weight:bold;margin:4px 0;">${fmt(data.contactos)}</p>
                <p style="margin:0;">${pct(data.contactosChange)} vs semana anterior</p>
              </td>
            </tr>
          </table>
        </div>
      `,
    });
  }
}
