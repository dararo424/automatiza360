import { IsEnum } from 'class-validator';
import { CotizacionStatus } from '../../../generated/prisma';

export class ActualizarEstadoCotizacionDto {
  @IsEnum(CotizacionStatus)
  estado: CotizacionStatus;
}
