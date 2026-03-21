import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CuponTipo } from '@prisma/client';

export class CrearCuponDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsEnum(CuponTipo)
  tipo: CuponTipo;

  @IsNumber()
  @Min(0)
  valor: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minCompra?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsos?: number;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}

export class ValidarCuponDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsNumber()
  @Min(0)
  monto: number;
}
