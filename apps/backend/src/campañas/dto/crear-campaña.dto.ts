import { IsNotEmpty, IsString } from 'class-validator';

export class CrearCampañaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;
}
