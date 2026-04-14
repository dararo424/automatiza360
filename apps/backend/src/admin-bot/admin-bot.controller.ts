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
import { TicketStatus } from '@prisma/client';
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

  // ── Órdenes pendientes ─────────────────────────────────────────────────────

  @Get('ordenes/pendientes/:tenantId')
  ordenesPendientes(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.ordenesPendientes(tenantId);
  }
}
