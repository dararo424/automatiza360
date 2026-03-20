import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContactosModule } from '../contactos/contactos.module';
import { OrdenesController } from './ordenes.controller';
import { OrdenesService } from './ordenes.service';

@Module({
  imports: [AuthModule, ContactosModule],
  controllers: [OrdenesController],
  providers: [OrdenesService],
})
export class OrdenesModule {}
