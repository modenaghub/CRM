import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Cadastro completo de clientes (prompt-mestre, seção 44). Campos adicionais
// específicos de vertical devem entrar via Custom Field Builder (seção 18),
// não aqui.
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsOptional() @IsString() tradeName?: string;
  @IsOptional() @IsString() document?: string;
  @IsOptional() @IsString() stateRegistration?: string;
  @IsOptional() @IsString() municipalRegistration?: string;
  @IsOptional() @IsString() cnae?: string;
  @IsOptional() @IsString() taxRegime?: string;
  @IsOptional() @IsString() segment?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() priceTable?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() commercialRegion?: string;
  @IsOptional() @IsString() abcClassification?: string;
  @IsOptional() @IsString() status?: string;
}
