import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrosCampañaDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minPuntos?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  diasSinComprar?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  diasDesdeUltimaCompra?: number;
}

export class CrearCampañaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;

  @IsOptional()
  @IsObject()
  @Type(() => FiltrosCampañaDto)
  filtros?: FiltrosCampañaDto;
}

export class PreviewCampañaDto {
  @IsOptional()
  @IsObject()
  @Type(() => FiltrosCampañaDto)
  filtros?: FiltrosCampañaDto;
}
