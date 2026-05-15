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

export class TestcaseDto {
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
  @Type(() => TestcaseDto)
  @IsOptional()
  testcases?: TestcaseDto[];
}


export class UpdateProblemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['Easy', 'Medium', 'Hard'])
  @IsOptional()
  type?: ProblemType;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  points?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  serialNo?: number;

  @IsString()
  @IsOptional()
  content?: string;

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
  @Type(() => TestcaseDto)
  @IsOptional()
  testcases?: TestcaseDto[];
}