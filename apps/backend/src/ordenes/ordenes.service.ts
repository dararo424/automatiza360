import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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

  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearOrdenDto, tenantId: string) {
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

    const total = dto.items.reduce((sum, item) => {
      return sum + productMap.get(item.nombre_producto.toLowerCase())!.price * item.cantidad;
    }, 0);

    const notesPartes = [
      `Cliente: ${dto.nombre_cliente}`,
      `Pago: ${dto.metodo_pago}`,
      `Dirección: ${dto.direccion_entrega}`,
    ];
    if (dto.notas) notesPartes.push(`Notas: ${dto.notas}`);

    return this.prisma.$transaction(async (tx) => {
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
