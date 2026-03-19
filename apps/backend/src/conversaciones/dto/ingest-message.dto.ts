import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { MessageDirection } from '@prisma/client';

export class IngestMessageDto {
  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsEnum(MessageDirection)
  direction: MessageDirection;
}
