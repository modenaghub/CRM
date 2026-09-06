import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

// Onboarding (prompt-mestre, seção 73): Etapa 1 (nome da empresa) + Etapa 2
// (segmento -> Vertical Engine, seção 4) acontecem juntas neste endpoint para
// já nascer a organização com o template de vertical aplicado.
export class RegisterOrganizationDto {
  @IsString()
  @IsNotEmpty()
  organizationName!: string;

  @IsString()
  @IsNotEmpty()
  segmentKey!: string; // ex: industria | oficina | distribuidora | ... | personalizado

  @IsString()
  @IsNotEmpty()
  adminName!: string;

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(6)
  adminPassword!: string;

  @IsOptional()
  @IsString()
  document?: string;
}
