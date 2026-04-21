import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AutomacionTrigger } from '@prisma/client';

const PASO_TIPOS = ['WAIT', 'SEND_WHATSAPP'] as const;

export class AutomacionPasoDto {
  @IsInt()
  orden: number;

  @IsIn(PASO_TIPOS, { message: `tipo debe ser: ${PASO_TIPOS.join(', ')}` })
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
