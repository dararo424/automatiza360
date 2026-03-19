import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class UpsertContactDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  tags?: string;
}
