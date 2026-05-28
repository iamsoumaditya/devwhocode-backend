import {
  IsString,
  IsEnum,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PROBLEM_TYPE } from '../constant';

export type ProblemType = (typeof PROBLEM_TYPE)[number];

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

  @IsEnum(PROBLEM_TYPE)
  type: ProblemType;

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

  @IsEnum(PROBLEM_TYPE)
  @IsOptional()
  type?: ProblemType;

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

export class ProblemToAssignmentDto {
  @IsUUID('4')
  problemId: string;
}

export class ReorderProblemsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  problemIds: string[];
}
