import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CampañasService } from './campañas.service';
import { CrearCampañaDto, PreviewCampañaDto } from './dto/crear-campaña.dto';

const PLANES_CON_CAMPANAS = ['PRO', 'BUSINESS'];

@Controller('campanas')
@UseGuards(JwtAuthGuard)
export class CampañasController {
  constructor(
    private readonly svc: CampañasService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkPlan(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: true },
    });
    if (!PLANES_CON_CAMPANAS.includes(tenant.plan)) {
      throw new ForbiddenException(
        'Las campañas masivas están disponibles desde el plan Pro. Actualiza tu plan para acceder.',
      );
    }
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.svc.findAll(user.tenantId);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CrearCampañaDto) {
    await this.checkPlan(user.tenantId);
    return this.svc.create(user.tenantId, dto);
  }

  @Post('preview')
  async preview(@CurrentUser() user: any, @Body() dto: PreviewCampañaDto) {
    await this.checkPlan(user.tenantId);
    return this.svc.previewContactos(user.tenantId, dto.filtros);
  }

  @Post(':id/enviar')
  async enviar(@CurrentUser() user: any, @Param('id') id: string) {
    await this.checkPlan(user.tenantId);
    return this.svc.enviar(user.tenantId, id);
  }
}
