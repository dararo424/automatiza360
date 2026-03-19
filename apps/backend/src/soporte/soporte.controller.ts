import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SoporteService } from './soporte.service';
import { MensajeSoporteDto } from './dto/mensaje-soporte.dto';

@Controller('soporte')
@UseGuards(JwtAuthGuard)
export class SoporteController {
  constructor(private readonly soporteService: SoporteService) {}

  @Post('mensaje')
  async enviarMensaje(
    @CurrentUser() user: any,
    @Body() dto: MensajeSoporteDto,
  ) {
    return this.soporteService.responderMensaje(
      user.tenantId,
      dto.mensaje,
      dto.historial ?? [],
    );
  }
}
