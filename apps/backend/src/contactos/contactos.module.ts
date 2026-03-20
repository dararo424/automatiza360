import { Module } from '@nestjs/common';
import { AutomacionesModule } from '../automaciones/automaciones.module';
import { ContactosController } from './contactos.controller';
import { ContactosService } from './contactos.service';

@Module({
  imports: [AutomacionesModule],
  controllers: [ContactosController],
  providers: [ContactosService],
  exports: [ContactosService],
})
export class ContactosModule {}
