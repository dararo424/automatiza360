import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CrearSucursalDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  twilioNumber?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
