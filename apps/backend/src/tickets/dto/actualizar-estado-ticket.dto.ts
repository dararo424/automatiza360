import { IsEnum } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class ActualizarEstadoTicketDto {
  @IsEnum(TicketStatus)
  estado: TicketStatus;
}
