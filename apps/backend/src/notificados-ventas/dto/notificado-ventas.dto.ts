import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum RolNotificado {
  VENDEDOR = 'VENDEDOR',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
}

export class CrearNotificadoVentasDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'Teléfono inválido (ej: +573001234567)',
  })
  phone!: string;

  @IsOptional()
  @IsEnum(RolNotificado)
  rol?: RolNotificado;

  @IsOptional()
  @IsBoolean()
  resumenMatinal?: boolean;

  @IsOptional()
  @IsBoolean()
  resumenCierre?: boolean;

  @IsOptional()
  @IsBoolean()
  notifInstantanea?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoMinimo?: number;
}

export class ActualizarNotificadoVentasDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'Teléfono inválido',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(RolNotificado)
  rol?: RolNotificado;

  @IsOptional()
  @IsBoolean()
  resumenMatinal?: boolean;

  @IsOptional()
  @IsBoolean()
  resumenCierre?: boolean;

  @IsOptional()
  @IsBoolean()
  notifInstantanea?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoMinimo?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
