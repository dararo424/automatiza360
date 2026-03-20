import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AutomacionTrigger } from '@prisma/client';

export class AutomacionPasoDto {
  @IsInt()
  orden: number;

  @IsString()
  tipo: string;

  @IsObject()
  config: Record<string, unknown>;
}

export class CrearAutomacionDto {
  @IsString()
  nombre: string;

  @IsEnum(AutomacionTrigger)
  trigger: AutomacionTrigger;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutomacionPasoDto)
  pasos: AutomacionPasoDto[];
}
