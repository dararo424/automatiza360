import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { PublicService } from './public.service';

class AnalyzeBusinessDto {
  @IsString()
  @MinLength(10)
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
}
