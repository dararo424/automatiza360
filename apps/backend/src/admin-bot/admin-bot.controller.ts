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
import { AdminBotService } from './admin-bot.service';
import {
  ActualizarPrecioDto,
  ActualizarStockDto,
  CambiarEstadoCitaDto,
  CambiarEstadoOrdenDto,
  CambiarEstadoTicketDto,
  CancelarCitasRangoDto,
  CargarMenuDiaDto,
  CrearCampañaRapidaDto,
  CrearCitaAdminDto,
  CrearContactoAdminDto,
  CrearCuponAdminDto,
  CrearOActualizarProductoDto,
  CrearTicketAdminDto,
  EliminarProductoDto,
  NotificarCancelacionDto,
  ReagendarCitaDto,
  RegistrarGastoDto,
} from './dto/admin-bot.dto';

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

  // ── Tenant config (consumido por AI service para personalidad del bot) ────

  @Get('tenant-config/:tenantId')
  getTenantConfig(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.getTenantConfig(tenantId);
  }

  // ── Menú del día ───────────────────────────────────────────────────────────

  @Post('menu-dia')
  cargarMenuDia(
    @Body() dto: CargarMenuDiaDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cargarMenuDia(dto.tenantId, dto.items);
  }

  // ── Productos ──────────────────────────────────────────────────────────────

  @Post('producto')
  crearOActualizarProducto(
    @Body() dto: CrearOActualizarProductoDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.crearOActualizarProducto(
      dto.tenantId,
      dto.nombre,
      dto.precio,
      dto.stock,
      dto.descripcion,
    );
  }

  @Patch('producto/stock')
  actualizarStock(
    @Body() dto: ActualizarStockDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.actualizarStock(dto.tenantId, dto.nombre, dto.stock);
  }

  @Patch('producto/precio')
  actualizarPrecio(
    @Body() dto: ActualizarPrecioDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.actualizarPrecio(dto.tenantId, dto.nombre, dto.precio);
  }

  @Delete('producto')
  eliminarProducto(
    @Body() dto: EliminarProductoDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.eliminarProducto(dto.tenantId, dto.nombre);
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
    @Body() dto: CambiarEstadoTicketDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cambiarEstadoTicket(id, dto.tenantId, dto.estado, dto.fotoUrl);
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
    @Body() dto: CancelarCitasRangoDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cancelarCitasRango(
      dto.tenantId,
      dto.fecha,
      dto.horaDesde,
      dto.profesionalId,
    );
  }

  @Post('citas/notificar-cancelacion')
  notificarCancelacion(
    @Body() dto: NotificarCancelacionDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.notificarPacientesCancelacion(
      dto.tenantId,
      dto.industry,
      dto.pacientes,
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
    @Body() dto: CambiarEstadoOrdenDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cambiarEstadoOrden(dto.tenantId, parseInt(numero, 10), dto.estado);
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
    @Body() dto: CrearCitaAdminDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.crearCitaAdmin(
      dto.tenantId,
      dto.clientName,
      dto.clientPhone,
      dto.serviceName,
      dto.fecha,
      dto.hora,
      dto.profesionalNombre,
    );
  }

  @Patch('citas/:id/estado')
  cambiarEstadoCita(
    @Param('id') id: string,
    @Body() dto: CambiarEstadoCitaDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.cambiarEstadoCita(dto.tenantId, id, dto.estado);
  }

  @Patch('citas/:id/reagendar')
  reagendarCita(
    @Param('id') id: string,
    @Body() dto: ReagendarCitaDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.reagendarCita(dto.tenantId, id, dto.nuevaFecha, dto.nuevaHora);
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
    @Body() dto: RegistrarGastoDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.registrarGasto(dto.tenantId, dto.descripcion, dto.monto, dto.categoria);
  }

  // ── Ticket nuevo ───────────────────────────────────────────────────────────

  @Post('ticket')
  crearTicket(
    @Body() dto: CrearTicketAdminDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.crearTicket(
      dto.tenantId,
      dto.clientName,
      dto.clientPhone,
      dto.device,
      dto.issue,
      dto.fotoUrl,
    );
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
    @Body() dto: CrearCampañaRapidaDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.crearCampañaRapida(dto.tenantId, dto.mensaje);
  }

  // ── Reseñas ────────────────────────────────────────────────────────────────

  @Get('resenas/:tenantId')
  verResenasRecientes(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.verResenasRecientes(tenantId);
  }

  // ── Cupones ────────────────────────────────────────────────────────────────

  @Get('cupones/:tenantId')
  verCuponesActivos(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.verCuponesActivos(tenantId);
  }

  @Post('cupon')
  crearCupon(
    @Body() dto: CrearCuponAdminDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.crearCupon(
      dto.tenantId,
      dto.codigo,
      dto.tipo,
      dto.valor,
      dto.minCompra,
      dto.maxUsos,
      dto.fechaVencimiento,
    );
  }

  // ── Contactos ──────────────────────────────────────────────────────────────

  @Get('contactos/recientes/:tenantId')
  listarContactosRecientes(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.listarContactosRecientes(tenantId);
  }

  @Post('contacto')
  agregarContacto(
    @Body() dto: CrearContactoAdminDto,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.agregarContacto(dto.tenantId, dto.nombre, dto.phone, dto.email, dto.notas);
  }

  // ── Turnos ─────────────────────────────────────────────────────────────────

  @Get('turnos/:tenantId')
  verTurnos(
    @Param('tenantId') tenantId: string,
    @Query('fecha') fecha: string | undefined,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.verTurnos(tenantId, fecha);
  }

  // ── Garantías ──────────────────────────────────────────────────────────────

  @Get('garantias/:tenantId')
  verGarantiasActivas(
    @Param('tenantId') tenantId: string,
    @Headers('x-internal-key') key: string,
  ) {
    verifyInternalKey(key);
    return this.service.verGarantiasActivas(tenantId);
  }
}
