import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class OrdenCompraItemDto {
  @IsString()
  nombre: string;

  @IsInt()
  cantidad: number;

  @IsNumber()
  precioUnitario: number;
}

export class CrearOrdenCompraDto {
  @IsString()
  proveedorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdenCompraItemDto)
  items: OrdenCompraItemDto[];

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsDateString()
  esperadaAt?: string;
}
