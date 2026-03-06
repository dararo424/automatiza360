import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  NEQUI = 'nequi',
  DAVIPLATA = 'daviplata',
  TARJETA = 'tarjeta',
}

export class ItemOrdenBotDto {
  @IsString()
  @IsNotEmpty()
  nombre_producto: string;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CrearOrdenBotDto {
  @IsString()
  @IsNotEmpty()
  nombre_cliente: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ItemOrdenBotDto)
  items: ItemOrdenBotDto[];

  @IsEnum(MetodoPago)
  metodo_pago: MetodoPago;

  @IsString()
  @IsNotEmpty()
  direccion_entrega: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
