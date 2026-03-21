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
import { CuponesService } from './cupones.service';
import { CrearCuponDto, ValidarCuponDto } from './dto/crear-cupon.dto';

@Controller('cupones')
@UseGuards(JwtAuthGuard)
export class CuponesController {
  constructor(private readonly svc: CuponesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.svc.findAll(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CrearCuponDto) {
    return this.svc.create(user.tenantId, dto);
  }

  @Patch(':id/toggle')
  toggle(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.toggle(user.tenantId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.remove(user.tenantId, id);
  }

  @Post('validar')
  validar(@CurrentUser() user: any, @Body() dto: ValidarCuponDto) {
    return this.svc.validar(user.tenantId, dto.codigo, dto.monto);
  }
}
