import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CrearGarantiaDto {
  @IsString()
  @IsNotEmpty()
  clienteNombre: string;

  @IsString()
  @IsNotEmpty()
  clientePhone: string;

  @IsString()
  @IsNotEmpty()
  producto: string;

  @IsString()
  @IsOptional()
  numeroSerie?: string;

  @IsString()
  @IsNotEmpty()
  fechaCompra: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  mesesGarantia?: number;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsOptional()
  ticketId?: string;
}
