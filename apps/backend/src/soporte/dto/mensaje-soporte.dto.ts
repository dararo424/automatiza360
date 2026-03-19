import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class HistorialItemDto {
  @IsString()
  role: string;

  @IsString()
  content: string;
}

export class MensajeSoporteDto {
  @IsString()
  mensaje: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HistorialItemDto)
  historial?: { role: string; content: string }[];
}
