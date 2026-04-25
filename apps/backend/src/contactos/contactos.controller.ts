import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ContactosService } from './contactos.service';
import { UpsertContactDto } from './dto/upsert-contact.dto';

@Controller('contactos')
@UseGuards(JwtAuthGuard)
export class ContactosController {
  constructor(private readonly svc: ContactosService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.svc.list(user.tenantId, search);
  }

  @Post()
  upsert(@CurrentUser() user: any, @Body() dto: UpsertContactDto) {
    return this.svc.upsert(user.tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpsertContactDto,
  ) {
    return this.svc.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.remove(user.tenantId, id);
  }

  @Get(':id/historial')
  getHistorial(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.getHistorial(user.tenantId, id);
  }

  @Post(':id/canjear-puntos')
  canjearPuntos(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { puntos: number },
  ) {
    return this.svc.canjearPuntos(user.tenantId, id, body.puntos);
  }

  @Post('desuscribir')
  desuscribir(@CurrentUser() user: any, @Body() body: { phone: string }) {
    return this.svc.marcarDesuscrito(user.tenantId, body.phone);
  }
}
