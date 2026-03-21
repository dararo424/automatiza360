import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { AutomacionesModule } from '../automaciones/automaciones.module';
import { PushModule } from '../push/push.module';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';

@Module({
  imports: [CalendarModule, AutomacionesModule, PushModule],
  controllers: [CitasController],
  providers: [CitasService],
  exports: [CitasService],
})
export class CitasModule {}
