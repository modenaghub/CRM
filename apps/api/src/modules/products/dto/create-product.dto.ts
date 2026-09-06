import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() ean?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() cost?: number;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsNumber() stock?: number;
  @IsOptional() @IsNumber() minStock?: number;
  @IsOptional() @IsString() supplierId?: string;
  @IsOptional() @IsString() status?: string;
}
