import { IsEnum, IsInt, Min } from 'class-validator';

export class AjustarStockDto {
  @IsInt()
  @Min(1)
  cantidad: number;

  @IsEnum(['entrada', 'salida'])
  tipo: 'entrada' | 'salida';
}
