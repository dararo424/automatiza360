import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearGastoDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  monto: number;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsString()
  @IsOptional()
  fecha?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
