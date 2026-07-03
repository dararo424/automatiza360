import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentMode } from '@prisma/client';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  horario?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @IsString()
  botName?: string;

  @IsOptional()
  @IsString()
  botTone?: string;
}

export class ActualizarPagosConfigDto {
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  wompiPublicKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  wompiIntegritySecret?: string;
}
