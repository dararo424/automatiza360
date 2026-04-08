import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TallasService } from './tallas.service';

@UseGuards(JwtAuthGuard)
@Controller('tallas')
export class TallasController {
  constructor(private readonly tallasService: TallasService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.tallasService.cargarDesdeBuffer(req.user.tenantId, file.buffer);
  }

  @Post('sync-sheets')
  async syncSheets(@Body('sheetUrl') sheetUrl: string, @Request() req) {
    return this.tallasService.sincronizarGoogleSheets(req.user.tenantId, sheetUrl);
  }

  @Get('config')
  async getConfig(@Request() req) {
    return this.tallasService.getConfig(req.user.tenantId);
  }

  @Get('historial')
  async getHistorial(@Request() req) {
    return this.tallasService.getHistorial(req.user.tenantId);
  }

  @Post('bot/consultar')
  async consultarBot(
    @Body() body: { clientePhone: string; altura: number; peso: number; cintura?: number },
    @Request() req,
  ) {
    return this.tallasService.consultarTallaPorBot(
      req.user.tenantId,
      body.clientePhone,
      body.altura,
      body.peso,
      body.cintura,
    );
  }
}
