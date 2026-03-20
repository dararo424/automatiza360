import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImportacionService } from './importacion.service';

@UseGuards(JwtAuthGuard)
@Controller('importacion')
export class ImportacionController {
  constructor(private readonly importacionService: ImportacionService) {}

  @Post('contactos')
  @UseInterceptors(FileInterceptor('file'))
  importarContactos(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.importacionService.importarContactos(user.tenantId, file.buffer);
  }

  @Post('productos')
  @UseInterceptors(FileInterceptor('file'))
  importarProductos(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.importacionService.importarProductos(user.tenantId, file.buffer);
  }
}
