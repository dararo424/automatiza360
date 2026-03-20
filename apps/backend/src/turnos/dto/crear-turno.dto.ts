import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CrearTurnoDto {
  @IsString()
  userId: string;

  @IsDateString()
  fecha: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
