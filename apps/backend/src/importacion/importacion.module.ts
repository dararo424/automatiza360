import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ImportacionController } from './importacion.controller';
import { ImportacionService } from './importacion.service';

@Module({
  imports: [AuthModule],
  controllers: [ImportacionController],
  providers: [ImportacionService],
})
export class ImportacionModule {}
