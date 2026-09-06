import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOpportunityDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsNotEmpty() pipelineId!: string;
  @IsOptional() @IsString() stageId?: string; // se omitido, usa a primeira etapa do pipeline
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() prospectId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsNumber() value?: number;
  @IsOptional() @IsNumber() discount?: number;
  @IsOptional() @IsString() origin?: string;
  @IsOptional() @IsDateString() expectedCloseDate?: string;
}
