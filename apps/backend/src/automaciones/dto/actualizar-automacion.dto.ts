import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ActualizarPasoDto {
  @IsInt()
  orden: number;

  @IsString()
  tipo: string;

  @IsObject()
  config: Record<string, unknown>;
}

export class ActualizarAutomacionDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActualizarPasoDto)
  pasos?: ActualizarPasoDto[];
}
