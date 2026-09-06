import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Custom Field Builder (prompt-mestre, seção 18).
export class CreateCustomFieldDto {
  @IsString() @IsNotEmpty() entityType!: string; // customer|prospect|supplier|product|opportunity
  @IsString() @IsNotEmpty() key!: string;
  @IsString() @IsNotEmpty() label!: string;
  @IsString() @IsNotEmpty() fieldType!: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() options?: any[];
}
