import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CrearCitaBotDto {
  @IsString()
  clientName: string;

  @IsString()
  clientPhone: string;

  @IsString()
  serviceName: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  professionalName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
