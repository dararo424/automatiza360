import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MenuDiaController } from './menu-dia.controller';
import { MenuPublicoController } from './menu-publico.controller';
import { MenuDiaService } from './menu-dia.service';

@Module({
  imports: [AuthModule],
  controllers: [MenuDiaController, MenuPublicoController],
  providers: [MenuDiaService],
})
export class MenuDiaModule {}
