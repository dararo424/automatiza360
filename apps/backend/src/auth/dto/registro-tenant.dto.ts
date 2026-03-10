import { Industry } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegistroTenantDto {
  @IsString()
  @MinLength(2)
  businessName: string;

  @IsString()
  @MinLength(2)
  ownerName: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'El número de WhatsApp debe tener formato internacional (ej: +573001234567)',
  })
  ownerPhone: string;

  @IsEnum(Industry)
  industry: Industry;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
