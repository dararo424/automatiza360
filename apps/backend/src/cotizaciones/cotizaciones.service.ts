import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { CotizacionStatus, PaymentMode } from '@prisma/client';
import * as twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { NotificadosVentasService } from '../notificados-ventas/notificados-ventas.service';
import { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import { ActualizarEstadoCotizacionDto } from './dto/actualizar-estado-cotizacion.dto';

@Injectable()
export class CotizacionesService {
  private readonly logger = new Logger(CotizacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
    private readonly notificados: NotificadosVentasService,
  ) {}

  async crear(dto: CrearCotizacionDto, tenantId: string) {
    const productIds = [...new Set(dto.items.map((i) => i.productId))];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, active: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const id of productIds) {
      if (!productMap.has(id)) {
        throw new BadRequestException(`Producto no disponible: ${id}`);
      }
    }

    const total = dto.items.reduce((sum, item) => {
      return sum + productMap.get(item.productId)!.price * item.quantity;
    }, 0);

    const cotizacion = await this.prisma.$transaction(async (tx) => {
      const count = await tx.cotizacion.count({ where: { tenantId } });
      const number = count + 1;

      return tx.cotizacion.create({
        data: {
          number,
          clientName: dto.clientName,
          clientPhone: dto.clientPhone,
          notes: dto.notes,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          total,
          tenantId,
          status: CotizacionStatus.DRAFT,
          items: {
            create: dto.items.map((i) => ({
              quantity: i.quantity,
              price: productMap.get(i.productId)!.price,
              name: productMap.get(i.productId)!.name,
              subtotal: productMap.get(i.productId)!.price * i.quantity,
            })),
          },
        },
        include: { items: true },
      });
    });

    // Notificación en panel (campana) — fire-and-forget
    this.prisma.notificacion
      .create({
        data: {
          type: 'COTIZACION_NUEVA',
          title: `Nueva cotización #${cotizacion.number}`,
          message: `${cotizacion.clientName} cotizó $${cotizacion.total.toLocaleString('es-CO')}`,
          tenantId,
        },
      })
      .catch((err) => this.logger.error('Error creando notificación: %s', err?.message ?? err));

    // Push al panel — fire-and-forget
    this.pushService
      .sendToTenant(
        tenantId,
        'Nueva cotización',
        `${cotizacion.clientName} — $${cotizacion.total.toLocaleString('es-CO')}`,
        '/cotizaciones',
      )
      .catch((err) => this.logger.error('Push error: %s', err?.message ?? err));

    // WhatsApp instantáneo a notificados — fire-and-forget
    this.notificados
      .notificarCotizacionNueva(tenantId, {
        number: cotizacion.number,
        clientName: cotizacion.clientName,
        clientPhone: cotizacion.clientPhone,
        total: cotizacion.total,
        items: cotizacion.items,
      })
      .catch((err) =>
        this.logger.error('Error notificando cotización via WhatsApp: %s', err?.message ?? err),
      );

    // Mensaje de cobro al cliente final (según paymentMode del tenant) — fire-and-forget
    if (cotizacion.clientPhone) {
      this.enviarMensajeCobroAlCliente(tenantId, {
        id: cotizacion.id,
        number: cotizacion.number,
        clientPhone: cotizacion.clientPhone,
        total: cotizacion.total,
      }).catch((err) =>
        this.logger.error('Error enviando cobro al cliente: %s', err?.message ?? err),
      );
    }

    return cotizacion;
  }

  /**
   * Envía al cliente final el mensaje de cobro según el paymentMode configurado
   * por el tenant: MANUAL (no envía nada), TEXT (envía mensaje predefinido),
   * o WOMPI (envía link de pago automatizado con las llaves del tenant).
   */
  private async enviarMensajeCobroAlCliente(
    tenantId: string,
    cot: { id: string; number: number; clientPhone: string; total: number },
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        twilioNumber: true,
        paymentMode: true,
        paymentText: true,
        wompiPublicKey: true,
        wompiIntegritySecret: true,
      },
    });
    if (!tenant) return;

    if (tenant.paymentMode === PaymentMode.MANUAL) return; // No envía nada al cliente

    const totalFmt = cot.total.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

    let body: string;

    if (tenant.paymentMode === PaymentMode.WOMPI) {
      if (!tenant.wompiPublicKey || !tenant.wompiIntegritySecret) {
        this.logger.warn(
          `Tenant ${tenantId} configurado en WOMPI pero faltan llaves — saltando cobro automático`,
        );
        return;
      }
      const amountInCents = Math.round(cot.total * 100);
      const referencia = `COT-${cot.id}`;
      const cadena = `${referencia}${amountInCents}COP${tenant.wompiIntegritySecret}`;
      const firma = createHash('sha256').update(cadena).digest('hex');

      const params = new URLSearchParams({
        'public-key': tenant.wompiPublicKey,
        currency: 'COP',
        'amount-in-cents': String(amountInCents),
        reference: referencia,
        'signature:integrity': firma,
        'redirect-url': `${process.env.FRONTEND_URL ?? ''}/pago-resultado`,
      });
      const url = `https://checkout.wompi.co/p/?${params.toString()}`;

      body =
        `💳 ¡Tu cotización #${cot.number} en ${tenant.name} está lista!\n\n` +
        `Total: *${totalFmt}*\n\n` +
        `Paga seguro con tarjeta, Nequi, Daviplata o PSE en este enlace:\n${url}\n\n` +
        `Una vez confirmado el pago, prepararemos tu pedido. ¡Gracias! 🙏`;
    } else {
      // TEXT mode
      const texto = tenant.paymentText?.trim();
      if (!texto) {
        this.logger.warn(`Tenant ${tenantId} en modo TEXT sin paymentText configurado`);
        return;
      }
      body =
        `💳 ¡Tu cotización #${cot.number} en ${tenant.name} está lista!\n\n` +
        `Total: *${totalFmt}*\n\n` +
        `${texto}`;
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = tenant.twilioNumber ?? process.env.TWILIO_WHATSAPP_NUMBER;
    if (!sid || !token || !from) return;

    try {
      const client = twilio.default(sid, token);
      await client.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${this.normalizePhone(cot.clientPhone)}`,
        body,
      });
      this.logger.log(`Cobro enviado al cliente para cotización #${cot.number}`);
    } catch (err) {
      this.logger.error(`Twilio error enviando cobro #${cot.number}: ${(err as Error).message}`);
    }
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+57${cleaned.replace(/^0+/, '')}`;
  }

  listar(tenantId: string, estado?: CotizacionStatus) {
    return this.prisma.cotizacion.findMany({
      where: { tenantId, ...(estado && { status: estado }) },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async buscarUno(id: string, tenantId: string) {
    const cotizacion = await this.prisma.cotizacion.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }
    return cotizacion;
  }

  async actualizarEstado(
    id: string,
    dto: ActualizarEstadoCotizacionDto,
    tenantId: string,
  ) {
    await this.buscarUno(id, tenantId);
    return this.prisma.cotizacion.update({
      where: { id },
      data: { status: dto.estado },
    });
  }

  async eliminar(id: string, tenantId: string) {
    await this.buscarUno(id, tenantId);
    return this.prisma.cotizacion.delete({ where: { id } });
  }
}
