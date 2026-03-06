import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MenuDiaController } from './menu-dia.controller';
import { MenuDiaService } from './menu-dia.service';

@Module({
  imports: [AuthModule],
  controllers: [MenuDiaController],
  providers: [MenuDiaService],
})
export class MenuDiaModule {}
