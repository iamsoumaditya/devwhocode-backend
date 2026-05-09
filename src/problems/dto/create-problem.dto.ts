import {
  IsString,
  IsEnum,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export type ProblemType = 'Easy' | 'Medium' | 'Hard';

export class CreateTestcaseDto {
  @IsString()
  input: string;

  @IsString()
  output: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}


export class CreateProblemDto {
  @IsString()
  name: string;

  @IsEnum(['Easy', 'Medium', 'Hard'])
  type: ProblemType;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  points: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  serialNo?: number;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  hint?: string;

  @IsBoolean()
  @IsOptional()
  canAttachFile?: boolean;

  @IsBoolean()
  @IsOptional()
  isTestcasesAvailable?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestcaseDto)
  @IsOptional()
  testcases?: CreateTestcaseDto[];
}