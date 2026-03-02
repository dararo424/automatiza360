import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../generated/prisma';

export class ActualizarEstadoDto {
  @IsEnum(OrderStatus)
  estado: OrderStatus;
}
