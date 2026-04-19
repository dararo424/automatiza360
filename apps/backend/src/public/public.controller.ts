import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Industry, Plan } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PublicService } from './public.service';

class AnalyzeBusinessDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;
}

class AutoOnboardDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  ownerName!: string;

  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'Número de WhatsApp inválido (ej: +573001234567)',
  })
  ownerPhone!: string;

  @IsEnum(Industry)
  industry!: Industry;

  @IsEnum(Plan)
  plan!: Plan;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Post('analyze-business')
  @HttpCode(200)
  @Throttle({ short: { ttl: 60000, limit: 4 }, medium: { ttl: 600000, limit: 10 } })
  analyzeBusiness(@Body() body: AnalyzeBusinessDto) {
    return this.service.analyzeBusiness(body.description);
  }

  @Post('auto-onboard')
  @HttpCode(201)
  @Throttle({ short: { ttl: 300000, limit: 3 }, medium: { ttl: 3600000, limit: 5 } })
  autoOnboard(@Body() body: AutoOnboardDto) {
    return this.service.autoOnboard(body);
  }
}
