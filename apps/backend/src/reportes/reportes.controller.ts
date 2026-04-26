import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';

function verifyInternalKey(key: string | undefined) {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || key !== expected) {
    throw new UnauthorizedException('X-Internal-Key inválida o ausente');
  }
}

@ApiTags('reportes')
@Controller('admin-bot/reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Post('whatsapp')
  enviarGraficaWhatsApp(
    @Headers('x-internal-key') key: string,
    @Body() body: { tenantId: string; phone: string; tipo: string; periodo: string },
  ) {
    verifyInternalKey(key);
    return this.service.enviarGraficaWhatsApp(body.tenantId, body.phone, body.tipo, body.periodo);
  }

  @Post('email')
  enviarReporteEmail(
    @Headers('x-internal-key') key: string,
    @Body() body: { tenantId: string; ownerEmail: string; ownerName: string; periodo: string },
  ) {
    verifyInternalKey(key);
    return this.service.enviarReporteEmail(body.tenantId, body.ownerEmail, body.ownerName, body.periodo);
  }
}
