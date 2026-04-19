import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { AppointmentStatus, OrderStatus, TicketStatus } from '@prisma/client';
import { AdminBotService } from './admin-bot.service';

function verifyInternalKey(key: string | undefined) {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || key !== expected) {
    throw new UnauthorizedException('X-Internal-Key inválida o ausente');
  }
}

@Controller('admin-bot')
export class AdminBotController {
  constructor(private readonly service: AdminBotService) {}

  // ── Check admin ────────────────────────────────────────────────────────────

  @Get('check/:phone')
  checkAdmin(
    @Param('phone') phone: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.checkAdmin(phone);
  }

  // ── Menú del día ───────────────────────────────────────────────────────────

  @Post('menu-dia')
  cargarMenuDia(
    @Body() body: { tenantId: string; items: Array<{ nombre: string; precio: number; descripcion?: string }> },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cargarMenuDia(body.tenantId, body.items);
  }

  // ── Productos ──────────────────────────────────────────────────────────────

  @Post('producto')
  crearOActualizarProducto(
    @Body() body: { tenantId: string; nombre: string; precio: number; stock?: number; descripcion?: string },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.crearOActualizarProducto(
      body.tenantId,
      body.nombre,
      body.precio,
      body.stock,
      body.descripcion,
    );
  }

  @Patch('producto/stock')
  actualizarStock(
    @Body() body: { tenantId: string; nombre: string; stock: number },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.actualizarStock(body.tenantId, body.nombre, body.stock);
  }

  @Patch('producto/precio')
  actualizarPrecio(
    @Body() body: { tenantId: string; nombre: string; precio: number },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.actualizarPrecio(body.tenantId, body.nombre, body.precio);
  }

  @Delete('producto')
  eliminarProducto(
    @Body() body: { tenantId: string; nombre: string },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.eliminarProducto(body.tenantId, body.nombre);
  }

  // ── Resumen del día ────────────────────────────────────────────────────────

  @Get('resumen-dia/:tenantId')
  resumenDia(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.resumenDia(tenantId);
  }

  // ── Tickets ────────────────────────────────────────────────────────────────

  @Patch('ticket/:id/estado')
  cambiarEstadoTicket(
    @Param('id') id: string,
    @Body() body: { tenantId: string; estado: TicketStatus; fotoUrl?: string },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cambiarEstadoTicket(id, body.tenantId, body.estado, body.fotoUrl);
  }

  @Get('ticket/buscar')
  buscarTicketPorNombre(
    @Query('tenantId') tenantId: string,
    @Query('nombre') nombre: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.buscarTicketPorNombre(tenantId, nombre);
  }

  // ── Citas ──────────────────────────────────────────────────────────────────

  @Post('citas/cancelar-rango')
  cancelarCitasRango(
    @Body() body: { tenantId: string; fecha: string; horaDesde?: string; profesionalId?: string },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cancelarCitasRango(
      body.tenantId,
      body.fecha,
      body.horaDesde,
      body.profesionalId,
    );
  }

  @Post('citas/notificar-cancelacion')
  notificarCancelacion(
    @Body() body: {
      tenantId: string;
      industry: string;
      pacientes: Array<{
        nombre: string;
        telefono: string;
        servicio: string;
        hora: string;
        profesional?: string | null;
      }>;
    },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.notificarPacientesCancelacion(
      body.tenantId,
      body.industry,
      body.pacientes,
    );
  }

  // ── Órdenes pendientes ─────────────────────────────────────────────────────

  @Get('ordenes/pendientes/:tenantId')
  ordenesPendientes(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.ordenesPendientes(tenantId);
  }

  @Get('orden/buscar')
  verDetalleOrden(
    @Query('tenantId') tenantId: string,
    @Query('numero') numero: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.verDetalleOrden(tenantId, parseInt(numero, 10));
  }

  @Patch('orden/:numero/estado')
  cambiarEstadoOrden(
    @Param('numero') numero: string,
    @Body() body: { tenantId: string; estado: OrderStatus },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cambiarEstadoOrden(body.tenantId, parseInt(numero, 10), body.estado);
  }

  // ── Citas avanzadas ────────────────────────────────────────────────────────

  @Get('citas/dia')
  verCitasDia(
    @Query('tenantId') tenantId: string,
    @Query('fecha') fecha: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.verCitasDia(tenantId, fecha);
  }

  @Post('citas/crear')
  crearCitaAdmin(
    @Body() body: {
      tenantId: string;
      clientName: string;
      clientPhone: string;
      serviceName: string;
      fecha: string;
      hora: string;
      profesionalNombre?: string;
    },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.crearCitaAdmin(
      body.tenantId,
      body.clientName,
      body.clientPhone,
      body.serviceName,
      body.fecha,
      body.hora,
      body.profesionalNombre,
    );
  }

  @Patch('citas/:id/estado')
  cambiarEstadoCita(
    @Param('id') id: string,
    @Body() body: { tenantId: string; estado: AppointmentStatus },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cambiarEstadoCita(body.tenantId, id, body.estado);
  }

  @Patch('citas/:id/reagendar')
  reagendarCita(
    @Param('id') id: string,
    @Body() body: { tenantId: string; nuevaFecha: string; nuevaHora: string },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.reagendarCita(body.tenantId, id, body.nuevaFecha, body.nuevaHora);
  }

  // ── Contactos ──────────────────────────────────────────────────────────────

  @Get('contacto/buscar')
  buscarContacto(
    @Query('tenantId') tenantId: string,
    @Query('query') query: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.buscarContacto(tenantId, query);
  }

  // ── Gastos ─────────────────────────────────────────────────────────────────

  @Post('gasto')
  registrarGasto(
    @Body() body: { tenantId: string; descripcion: string; monto: number; categoria: string },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.registrarGasto(body.tenantId, body.descripcion, body.monto, body.categoria);
  }

  // ── Ticket nuevo ───────────────────────────────────────────────────────────

  @Post('ticket')
  crearTicket(
    @Body() body: { tenantId: string; clientName: string; clientPhone: string; device: string; issue: string; fotoUrl?: string },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.crearTicket(body.tenantId, body.clientName, body.clientPhone, body.device, body.issue, body.fotoUrl);
  }

  // ── Cotizaciones pendientes ────────────────────────────────────────────────

  @Get('cotizaciones/pendientes/:tenantId')
  verCotizacionesPendientes(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.verCotizacionesPendientes(tenantId);
  }

  // ── Stock bajo ─────────────────────────────────────────────────────────────

  @Get('stock-bajo/:tenantId')
  verStockBajo(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.verStockBajo(tenantId);
  }

  // ── Resumen del mes ────────────────────────────────────────────────────────

  @Get('resumen-mes/:tenantId')
  resumenMes(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.resumenMes(tenantId);
  }

  // ── Campaña rápida ─────────────────────────────────────────────────────────

  @Post('campaña/rapida')
  crearCampañaRapida(
    @Body() body: { tenantId: string; mensaje: string },
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.crearCampañaRapida(body.tenantId, body.mensaje);
  }
}
