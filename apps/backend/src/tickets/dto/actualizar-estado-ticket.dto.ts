import { IsEnum } from 'class-validator';
import { TicketStatus } from '../../../generated/prisma';

export class ActualizarEstadoTicketDto {
  @IsEnum(TicketStatus)
  estado: TicketStatus;
}
