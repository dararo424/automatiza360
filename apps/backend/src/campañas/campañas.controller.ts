import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CampañasService } from './campañas.service';
import { CrearCampañaDto } from './dto/crear-campaña.dto';

@Controller('campanas')
@UseGuards(JwtAuthGuard)
export class CampañasController {
  constructor(private readonly svc: CampañasService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.svc.findAll(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CrearCampañaDto) {
    return this.svc.create(user.tenantId, dto);
  }

  @Post(':id/enviar')
  enviar(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.enviar(user.tenantId, id);
  }
}
