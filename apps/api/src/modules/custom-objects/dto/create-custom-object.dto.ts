import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class FieldInput {
  @IsString() @IsNotEmpty() key!: string;
  @IsString() @IsNotEmpty() label!: string;
  @IsString() @IsNotEmpty() fieldType!: string;
  @IsOptional() required?: boolean;
}

// Dynamic Object Engine (prompt-mestre, seção 17): cria objetos 100% dinâmicos
// (ex: Veículo, Imóvel, Projeto) sem alterar o código do núcleo.
export class CreateCustomObjectDto {
  @IsString() @IsNotEmpty() key!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() icon?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldInput)
  fields?: FieldInput[];
}
