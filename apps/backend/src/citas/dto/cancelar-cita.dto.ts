import { IsString } from 'class-validator';

export class CancelarCitaDto {
  @IsString()
  clientPhone: string;
}
