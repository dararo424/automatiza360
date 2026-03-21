import { Body, Controller, Get, Param, Patch, UseGuards, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PerfilService } from './perfil.service';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

@Controller()
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Get('perfil-publico/:slug')
  getPerfilPublico(@Param('slug') slug: string) {
    return this.perfilService.getPerfilPublico(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  getMiPerfil(@CurrentUser() user: any) {
    return this.perfilService.getMiPerfil(user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('perfil')
  actualizarPerfil(
    @CurrentUser() user: any,
    @Body() dto: ActualizarPerfilDto,
  ) {
    return this.perfilService.actualizarPerfil(user.tenantId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil/onboarding-status')
  getOnboardingStatus(@CurrentUser() user: any) {
    return this.perfilService.getOnboardingStatus(user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('perfil/onboarding-step')
  actualizarOnboardingStep(
    @CurrentUser() user: any,
    @Body('step') step: number,
  ) {
    return this.perfilService.actualizarOnboarding(user.tenantId, step);
  }
}
