import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AutomacionTrigger, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactosService } from '../contactos/contactos.service';
import { AutomacionesService } from '../automaciones/automaciones.service';
import { CuponesService } from '../cupones/cupones.service';
import { PushService } from '../push/push.service';
import { FlujoService } from '../flujos/flujos.service';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { CrearOrdenBotDto } from './dto/crear-orden-bot.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';

const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.CONFIRMED]:
    '✅ Hola! Tu pedido #{{number}} ha sido confirmado. ¡Lo estamos preparando con mucho cariño!',
  [OrderStatus.PREPARING]:
    '👨‍🍳 Tu pedido #{{number}} está en preparación. En breve estará listo.',
  [OrderStatus.READY]:
    '🛵 Tu pedido #{{number}} está en camino. ¡Pronto llegará a tu puerta!',
  [OrderStatus.DELIVERED]:
    '✅ Tu pedido #{{number}} fue entregado. ¡Gracias por preferir nuestro restaurante! Esperamos verte pronto 😊',
  [OrderStatus.CANCELLED]:
    '❌ Tu pedido #{{number}} fue cancelado. Si tienes dudas contáctanos directamente.',
};

@Injectable()
export class OrdenesService {
  private readonly logger = new Logger(OrdenesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contactosService: ContactosService,
    private readonly automacionesService: AutomacionesService,
    private readonly cuponesService: CuponesService,
    private readonly pushService: PushService,
    private readonly flujos: FlujoService,
  ) {}

  async crear(dto: CrearOrdenDto, tenantId: string) {
    await this.flujos.assertFlujoActivo(tenantId, 'ventas');
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

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.order.count({ where: { tenantId } });
      const number = count + 1;

      return tx.order.create({
        data: {
          number,
          total,
          notes: dto.notes,
          phone: dto.phone,
          tenantId,
          status: OrderStatus.PENDING,
          items: {
            create: dto.items.map((i) => ({
              quantity: i.quantity,
              price: productMap.get(i.productId)!.price,
              name: productMap.get(i.productId)!.name,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  listar(tenantId: string, estado?: OrderStatus) {
    return this.prisma.order.findMany({
      where: { tenantId, ...(estado && { status: estado }) },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async buscarUno(id: string, tenantId: string) {
    const orden = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!orden) {
      throw new NotFoundException('Orden no encontrada');
    }
    return orden;
  }

  async crearDesdeBot(dto: CrearOrdenBotDto, tenantId: string) {
    await this.flujos.assertFlujoActivo(tenantId, 'ventas');
    const nombres = dto.items.map((i) => i.nombre_producto.toLowerCase());

    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
    });

    const productMap = new Map(
      products.map((p) => [p.name.toLowerCase(), p]),
    );

    for (const nombre of nombres) {
      if (!productMap.has(nombre)) {
        throw new BadRequestException(`Producto no encontrado: "${nombre}"`);
      }
    }

    let total = dto.items.reduce((sum, item) => {
      return sum + productMap.get(item.nombre_producto.toLowerCase())!.price * item.cantidad;
    }, 0);

    let descuento = 0;
    if (dto.cuponCodigo) {
      const validacion = await this.cuponesService.validar(tenantId, dto.cuponCodigo, total);
      if (validacion.valido && validacion.descuento) {
        descuento = validacion.descuento;
        total = Math.max(0, total - descuento);
        await this.cuponesService.aplicar(tenantId, dto.cuponCodigo);
      }
    }

    const notesPartes = [
      `Cliente: ${dto.nombre_cliente}`,
      `Pago: ${dto.metodo_pago}`,
      `Dirección: ${dto.direccion_entrega}`,
    ];
    if (dto.notas) notesPartes.push(`Notas: ${dto.notas}`);
    if (descuento > 0) notesPartes.push(`Descuento: $${descuento.toLocaleString('es-CO')}`);

    const orden = await this.prisma.$transaction(async (tx) => {
      const count = await tx.order.count({ where: { tenantId } });
      return tx.order.create({
        data: {
          number: count + 1,
          total,
          notes: notesPartes.join(' | '),
          phone: dto.telefono,
          tenantId,
          status: OrderStatus.PENDING,
          items: {
            create: dto.items.map((i) => {
              const p = productMap.get(i.nombre_producto.toLowerCase())!;
              return { quantity: i.cantidad, price: p.price, name: p.name };
            }),
          },
        },
        include: { items: true },
      });
    });

    // Push notification — fire and forget
    this.pushService
      .sendToTenant(
        tenantId,
        'Nueva orden',
        `${dto.nombre_cliente || dto.telefono || 'Cliente'} realizó un pedido`,
        '/ordenes',
      )
      .catch((err) => this.logger.error('Push error: %s', err?.message ?? err));

    return orden;
  }

  async exportarCsv(tenantId: string): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const escape = (v: string | number | null | undefined) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const header = 'Numero,Estado,Total,Cliente,Fecha,Items';
    const rows = orders.map((o) => {
      const items = o.items
        .map((i) => `${i.quantity}x ${i.name}`)
        .join(' | ');
      return [
        escape(o.number),
        escape(o.status),
        escape(o.total),
        escape(o.phone ?? ''),
        escape(o.createdAt.toISOString()),
        escape(items),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  async generarLinkPago(tenantId: string, orderId: string): Promise<{ url: string }> {
    const orden = await this.buscarUno(orderId, tenantId);
    return this.buildLinkPago(orden.id, orden.total);
  }

  private async buildLinkPago(orderId: string, total: number): Promise<{ url: string }> {
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    if (!publicKey) throw new BadRequestException('WOMPI_PUBLIC_KEY no configurada');
    const amountInCents = Math.round(total * 100);
    const referencia = `ORD-${orderId}`;

    // Firma de integridad requerida por Wompi para evitar manipulación del monto
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? '';
    const cadena = `${referencia}${amountInCents}COP${integritySecret}`;
    const { createHash } = await import('crypto');
    const firma = createHash('sha256').update(cadena).digest('hex');

    const params = new URLSearchParams({
      'public-key': publicKey,
      currency: 'COP',
      'amount-in-cents': String(amountInCents),
      reference: referencia,
      'signature:integrity': firma,
      'redirect-url': `${process.env.FRONTEND_URL ?? ''}/pago-resultado`,
    });
    return { url: `https://checkout.wompi.co/p/?${params.toString()}` };
  }

  async enviarLinkPagoWhatsApp(
    tenantId: string,
    orderId: string,
  ): Promise<{ ok: true; url: string; sentTo: string } | { ok: false; reason: string }> {
    const orden = await this.buscarUno(orderId, tenantId);

    if (!orden.phone) {
      return { ok: false, reason: 'La orden no tiene teléfono del cliente' };
    }

    const { url } = await this.buildLinkPago(orden.id, orden.total);

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { name: true, twilioNumber: true },
    });
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = tenant.twilioNumber ?? process.env.TWILIO_WHATSAPP_NUMBER;

    if (!sid || !token || !from) {
      return { ok: false, reason: 'Twilio no está configurado' };
    }

    const totalFmt = orden.total.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    const body =
      `💳 Hola! Tu pedido #${orden.number} en ${tenant.name} está listo para pagar.\n\n` +
      `Total: *${totalFmt}*\n\n` +
      `Paga seguro con tarjeta, Nequi o PSE en este enlace:\n${url}\n\n` +
      `Una vez confirmado, prepararemos tu pedido. ¡Gracias! 🙏`;

    const to = orden.phone.startsWith('whatsapp:') ? orden.phone : `whatsapp:${orden.phone}`;
    const params = new URLSearchParams({
      From: `whatsapp:${from}`,
      To: to,
      Body: body,
    });
    const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const credentials = Buffer.from(`${sid}:${token}`).toString('base64');

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      if (!res.ok) {
        const text = await res.text();
        this.logger.error('Twilio link-pago error %d for order #%d: %s', res.status, orden.number, text);
        return { ok: false, reason: `Twilio respondió ${res.status}` };
      }
      this.logger.log('Link de pago enviado por WhatsApp para orden #%d → %s', orden.number, orden.phone);
      return { ok: true, url, sentTo: orden.phone };
    } catch (err: any) {
      this.logger.error('Failed to send payment link for order #%d: %s', orden.number, err?.message ?? err);
      return { ok: false, reason: err?.message ?? 'Error de red' };
    }
  }

  async actualizarEstado(
    id: string,
    dto: ActualizarEstadoDto,
    tenantId: string,
  ) {
    const orden = await this.buscarUno(id, tenantId);
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.estado },
    });

    if (orden.phone) {
      // Fire-and-forget — do not await so Twilio latency never affects the response
      this.sendWhatsAppNotification(orden.phone, orden.number, dto.estado).catch(
        (err) => this.logger.error('WhatsApp notification error: %s', err?.message ?? err),
      );
    }

    // Add loyalty points when order is delivered/completed
    if (
      (dto.estado === OrderStatus.DELIVERED || (dto.estado as string) === 'COMPLETED') &&
      orden.phone
    ) {
      const puntos = Math.floor(orden.total / 10000);
      if (puntos > 0) {
        this.contactosService
          .agregarPuntos(tenantId, orden.phone, puntos)
          .catch((err) => this.logger.error('Error agregando puntos de fidelización: %s', err?.message ?? err));
      }

      // Trigger automaciones
      this.automacionesService
        .dispararTrigger(
          tenantId,
          AutomacionTrigger.ORDER_DELIVERED,
          orden.phone,
          undefined,
          { orderId: id },
        )
        .catch((err) =>
          this.logger.error('Error disparando automatización ORDER_DELIVERED: %s', err?.message ?? err),
        );
    }

    return updated;
  }

  private async sendWhatsAppNotification(
    phone: string,
    orderNumber: number,
    status: OrderStatus,
  ): Promise<void> {
    const template = STATUS_MESSAGES[status];
    if (!template) return; // PENDING and unknown statuses → no notification

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!sid || !token || !from) {
      this.logger.warn(
        'Twilio env vars not configured — skipping WhatsApp notification for order #%d',
        orderNumber,
      );
      return;
    }

    const body = template.replace('{{number}}', String(orderNumber));
    const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;

    const params = new URLSearchParams({
      From: `whatsapp:${from}`,
      To: to,
      Body: body,
    });

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const credentials = Buffer.from(`${sid}:${token}`).toString('base64');

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(
          'Twilio API error %d for order #%d: %s',
          res.status,
          orderNumber,
          text,
        );
      } else {
        this.logger.log('WhatsApp notification sent for order #%d → %s', orderNumber, status);
      }
    } catch (err: any) {
      this.logger.error(
        'Failed to send WhatsApp notification for order #%d: %s',
        orderNumber,
        err?.message ?? err,
      );
    }
  }
}
