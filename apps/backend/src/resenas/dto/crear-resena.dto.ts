import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CrearResenaDto {
  @IsString()
  clientPhone: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comentario?: string;

  @IsString()
  tipo: string; // "ORDER" | "APPOINTMENT"

  @IsOptional()
  @IsString()
  referenciaId?: string;
}
