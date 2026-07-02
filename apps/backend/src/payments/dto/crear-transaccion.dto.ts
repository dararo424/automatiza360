import { IsIn, IsOptional } from 'class-validator';

export class CrearTransaccionDto {
  @IsIn(['STARTER', 'PRO', 'BUSINESS'])
  plan: 'STARTER' | 'PRO' | 'BUSINESS';

  @IsOptional()
  @IsIn(['MENSUAL', 'ANUAL'])
  periodo?: 'MENSUAL' | 'ANUAL';
}
