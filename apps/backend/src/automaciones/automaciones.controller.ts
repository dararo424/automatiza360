import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AutomacionesService } from './automaciones.service';
import { CrearAutomacionDto } from './dto/crear-automacion.dto';
import { ActualizarAutomacionDto } from './dto/actualizar-automacion.dto';

@UseGuards(JwtAuthGuard)
@Controller('automaciones')
export class AutomacionesController {
  constructor(private readonly automacionesService: AutomacionesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.automacionesService.findAll(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CrearAutomacionDto) {
    return this.automacionesService.create(user.tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ActualizarAutomacionDto,
  ) {
    return this.automacionesService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automacionesService.remove(user.tenantId, id);
  }

  @Patch(':id/toggle')
  toggle(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automacionesService.toggle(user.tenantId, id);
  }
}
