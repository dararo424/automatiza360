import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RegistrarNpsDto {
  @IsString()
  clientPhone: string;

  @IsInt()
  @Min(0)
  @Max(10)
  score: number;

  @IsOptional()
  @IsString()
  comentario?: string;

  @IsString()
  tipo: string;

  @IsOptional()
  @IsString()
  referenciaId?: string;
}
