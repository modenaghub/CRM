import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Cadastro de prospect (prompt-mestre, seção 41).
export class CreateProspectDto {
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsOptional() @IsString() tradeName?: string;
  @IsOptional() @IsString() document?: string;
  @IsOptional() @IsString() companyType?: string;
  @IsOptional() @IsString() segment?: string;
  @IsOptional() @IsString() subsegment?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsInt() employeesCount?: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() linkedin?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() origin?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() potential?: string;
  @IsOptional() @IsString() productsOfInterest?: string;
  @IsOptional() @IsString() observations?: string;
  @IsOptional() @IsInt() score?: number;
  @IsOptional() @IsString() status?: string;
}
