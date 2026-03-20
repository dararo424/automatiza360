import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampañasController } from './campañas.controller';
import { CampañasService } from './campañas.service';

@Module({
  imports: [AuthModule],
  controllers: [CampañasController],
  providers: [CampañasService],
})
export class CampañasModule {}
