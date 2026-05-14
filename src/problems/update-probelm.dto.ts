import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { type ProblemType } from './dto';

export class UpdateProblemDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() slug?: string;
  @IsEnum(['Easy', 'Medium', 'Hard']) @IsOptional() type?: ProblemType;
  @IsInt() @Min(0) @IsOptional() @Type(() => Number) points?: number;

  @IsString() @IsOptional() content?: string;
  @IsString() @IsOptional() hint?: string;
  @IsBoolean() @IsOptional() canAttachFile?: boolean;
  @IsBoolean() @IsOptional() isTestcasesAvailable?: boolean;
}
