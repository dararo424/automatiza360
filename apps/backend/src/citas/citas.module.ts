import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';

@Module({
  imports: [CalendarModule],
  controllers: [CitasController],
  providers: [CitasService],
})
export class CitasModule {}
