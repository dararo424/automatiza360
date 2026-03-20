import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResenasService } from './resenas.service';
import { CrearResenaDto } from './dto/crear-resena.dto';

@UseGuards(JwtAuthGuard)
@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenasService: ResenasService) {}

  @Post()
  create(@Body() dto: CrearResenaDto, @CurrentUser() user: any) {
    return this.resenasService.create(user.tenantId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.resenasService.findAll(user.tenantId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.resenasService.getStats(user.tenantId);
  }

  @Post('bot')
  createFromBot(@Body() dto: CrearResenaDto, @CurrentUser() user: any) {
    return this.resenasService.create(user.tenantId, dto);
  }
}
