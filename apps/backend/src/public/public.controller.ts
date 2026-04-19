import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Industry, Plan } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
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

  @IsString()
  @MaxLength(1000)
  description!: string;
}

@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Post('analyze-business')
  @HttpCode(200)
  analyzeBusiness(@Body() body: AnalyzeBusinessDto) {
    return this.service.analyzeBusiness(body.description);
  }

  @Post('auto-onboard')
  @HttpCode(201)
  autoOnboard(@Body() body: AutoOnboardDto) {
    return this.service.autoOnboard(body);
  }
}
