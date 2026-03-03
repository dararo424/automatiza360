import {
  IsString,
  MinLength,
  IsArray,
  ValidateNested,
  IsNumber,
  IsPositive,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SupplierProductItemDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsPositive()
  cost: number;

  @IsNumber()
  @IsPositive()
  price: number;
}

export class ImportarCatalogoDto {
  @IsString()
  @MinLength(2)
  supplierName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierProductItemDto)
  products: SupplierProductItemDto[];
}
