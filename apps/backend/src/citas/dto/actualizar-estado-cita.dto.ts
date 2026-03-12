import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class ActualizarEstadoCitaDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
