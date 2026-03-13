import { IsIn } from 'class-validator';

export class CrearTransaccionDto {
  @IsIn(['STARTER', 'PRO', 'BUSINESS'])
  plan: 'STARTER' | 'PRO' | 'BUSINESS';
}
