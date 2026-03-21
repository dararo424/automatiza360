import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContactosModule } from '../contactos/contactos.module';
import { AutomacionesModule } from '../automaciones/automaciones.module';
import { CuponesModule } from '../cupones/cupones.module';
import { PushModule } from '../push/push.module';
import { OrdenesController } from './ordenes.controller';
import { OrdenesService } from './ordenes.service';

@Module({
  imports: [AuthModule, ContactosModule, AutomacionesModule, CuponesModule, PushModule],
  controllers: [OrdenesController],
  providers: [OrdenesService],
})
export class OrdenesModule {}
