import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Tarefas e follow-up (prompt-mestre, seção 53).
export class CreateTaskDto {
  @IsString() @IsNotEmpty() type!: string; // call|whatsapp|email|meeting|visit|followup|internal|proposal|return
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() prospectId?: string;
  @IsOptional() @IsString() opportunityId?: string;
}
