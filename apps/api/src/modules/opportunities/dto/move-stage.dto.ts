import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MoveStageDto {
  @IsString() @IsNotEmpty() stageId!: string;
  @IsOptional() @IsString() lostReason?: string;
}
