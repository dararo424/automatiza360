import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CrearTransaccionDto } from './dto/crear-transaccion.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('crear-transaccion')
  crearTransaccion(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: CrearTransaccionDto,
  ) {
    return this.payments.crearTransaccion(
      user.tenantId,
      dto.plan,
      dto.periodo ?? 'MENSUAL',
    );
  }

  @SkipThrottle()
  @Post('webhook')
  procesarWebhook(
    @Body() payload: any,
    @Headers('x-event-checksum') firma: string,
  ) {
    return this.payments.procesarWebhook(payload, firma ?? '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('verificar/:transactionId')
  verificarTransaccion(
    @CurrentUser() user: { tenantId: string },
    @Param('transactionId') transactionId: string,
  ) {
    return this.payments.verificarTransaccion(user.tenantId, transactionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('activar-por-referencia')
  activarPorReferencia(
    @CurrentUser() user: { tenantId: string },
    @Body('referencia') referencia: string,
  ) {
    return this.payments.activarPorReferencia(user.tenantId, referencia);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscripcion')
  getSubscripcion(@CurrentUser() user: { tenantId: string }) {
    return this.payments.getSubscripcion(user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reembolso')
  solicitarReembolso(
    @CurrentUser() user: { tenantId: string },
    @Body() body: { referencia: string; razon?: string },
  ) {
    return this.payments.solicitarReembolso(
      user.tenantId,
      body.referencia,
      body.razon,
    );
  }
}
