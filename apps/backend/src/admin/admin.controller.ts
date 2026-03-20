import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { SuperadminGuard } from './superadmin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(SuperadminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metricas')
  getMetricas() {
    return this.adminService.getMetricas();
  }

  @Get('tenants')
  getTenants(
    @Query('status') status?: string,
    @Query('industry') industry?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getTenants({ status, industry, search });
  }

  @Get('tenants/:id')
  getTenant(@Param('id') id: string) {
    return this.adminService.getTenantById(id);
  }

  @Put('tenants/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('plan') plan?: string,
  ) {
    return this.adminService.updateStatus(id, status, plan);
  }

  @Post('tenants/:id/extend-trial')
  extenderTrial(@Param('id') id: string, @Body('days') days: number) {
    return this.adminService.extenderTrial(id, days);
  }

  @Patch('tenants/:id/plan')
  cambiarPlan(
    @Param('id') id: string,
    @Body('plan') plan: string,
    @Body('status') status?: string,
  ) {
    return this.adminService.updateStatus(id, status ?? 'ACTIVE', plan);
  }
}
