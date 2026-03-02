import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ActualizarTicketDto {
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;
}
