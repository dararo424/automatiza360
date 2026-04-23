import { Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'dararo424@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://app.automatiza360.com';

@Injectable()
export class HazloPorMiService {
  private readonly logger = new Logger(HazloPorMiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async crearSolicitud(tenantId: string, descripcion: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { id: true, name: true, industry: true, slug: true },
    });

    const owner = await this.prisma.user.findFirst({
      where: { tenantId, role: Role.OWNER },
      select: { email: true, name: true },
    });

    const solicitud = await this.prisma.hazloRequest.create({
      data: { tenantId, descripcion },
    });

    // Email to admin team
    await this.emailService.send({
      to: ADMIN_EMAIL,
      subject: `[Hazlo por mí] Nueva solicitud — ${tenant.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#0f172a;padding:20px;border-radius:12px 12px 0 0">
            <h2 style="color:white;margin:0">Nueva solicitud "Hazlo por mí"</h2>
          </div>
          <div style="background:white;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <tr><td style="padding:8px 0;color:#64748b;width:130px">Negocio</td><td style="color:#0f172a;font-weight:600">${tenant.name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Industria</td><td style="color:#0f172a">${tenant.industry}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Owner</td><td style="color:#0f172a">${owner?.name ?? '-'} (${owner?.email ?? '-'})</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">ID solicitud</td><td style="color:#64748b;font-size:12px">${solicitud.id}</td></tr>
            </table>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px">
              <p style="color:#64748b;font-size:12px;margin:0 0 8px">Descripción del negocio:</p>
              <p style="color:#0f172a;margin:0;white-space:pre-wrap">${descripcion}</p>
            </div>
            <a href="${FRONTEND_URL}/admin/tenants" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
              Ver en Admin Panel →
            </a>
          </div>
        </div>
      `,
    });

    // Confirmation email to owner
    if (owner?.email) {
      await this.emailService.send({
        to: owner.email,
        subject: `Recibimos tu solicitud — ${tenant.name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0f172a;padding:20px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:white;margin:0;font-size:22px">Automatiza360</h1>
            </div>
            <div style="background:white;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
              <div style="text-align:center;margin-bottom:24px">
                <div style="font-size:48px">🚀</div>
                <h2 style="color:#0f172a;margin:8px 0">¡Solicitud recibida, ${owner.name}!</h2>
                <p style="color:#64748b">Configuraremos el bot de ${tenant.name} en las próximas <strong>24-48 horas</strong>.</p>
              </div>
              <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin-bottom:24px">
                <p style="color:#0369a1;font-weight:600;margin:0 0 12px">¿Qué hacemos por ti?</p>
                <ul style="color:#0369a1;margin:0;padding-left:20px;line-height:1.8">
                  <li>Configuramos tu catálogo de productos o servicios</li>
                  <li>Programamos las respuestas del bot según tu negocio</li>
                  <li>Probamos el flujo completo de atención al cliente</li>
                  <li>Te entregamos el bot listo para activar</li>
                </ul>
              </div>
              <p style="color:#64748b;font-size:14px">Te contactaremos a este email cuando esté listo. Si tienes dudas, responde este correo.</p>
              <a href="${FRONTEND_URL}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">
                Ir a mi panel →
              </a>
            </div>
          </div>
        `,
      });
    }

    this.logger.log(`Hazlo por mí request created: ${solicitud.id} for tenant ${tenantId}`);
    return { id: solicitud.id, status: solicitud.status };
  }

  async getMisSolicitudes(tenantId: string) {
    return this.prisma.hazloRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, descripcion: true, status: true, createdAt: true },
    });
  }
}
