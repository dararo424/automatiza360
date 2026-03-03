import { IsOptional, IsString } from 'class-validator';

export class BuscarProductosDto {
  @IsOptional()
  @IsString()
  q?: string;
}
