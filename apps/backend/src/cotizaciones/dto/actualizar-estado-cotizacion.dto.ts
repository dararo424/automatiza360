import { IsEnum } from 'class-validator';
import { CotizacionStatus } from '@prisma/client';

export class ActualizarEstadoCotizacionDto {
  @IsEnum(CotizacionStatus)
  estado: CotizacionStatus;
}
