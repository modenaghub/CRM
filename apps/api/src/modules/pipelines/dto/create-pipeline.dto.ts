import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class StageInput {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() probability?: number;
  @IsOptional() isWon?: boolean;
  @IsOptional() isLost?: boolean;
}

// Pipeline Builder (prompt-mestre, seção 19): nome + etapas configuráveis.
export class CreatePipelineDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() type?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StageInput)
  stages!: StageInput[];
}
