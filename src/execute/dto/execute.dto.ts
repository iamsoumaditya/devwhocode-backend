import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBase64,
  IsInt,
  Min,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import {
  type ExecutorTestResult,
  type ResultOfExecution,
} from '../types/executor.types';

export class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  contents: string;
}

export class RunCodeDto {
  @IsUUID()
  @IsNotEmpty()
  problemId: string;

  @IsInt()
  @Min(1)
  languageId: number;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  code: string;

  @IsOptional()
  @Type(() => AttachmentDto)
  attachment?: AttachmentDto;

  @IsInt()
  labId: number;
}

export class SubmitCodeDto {
  @IsUUID()
  @IsNotEmpty()
  problemId: string;

  @IsInt()
  @Min(1)
  languageId: number;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  code: string;

  @IsOptional()
  @Type(() => AttachmentDto)
  attachment?: AttachmentDto;

  @IsInt()
  labId: number;
}

export class ExecutionResultDto {
  @Expose()
  problemId: string;
  @Expose()
  result: ResultOfExecution;
  @Expose()
  executionTime: number;
  @Expose()
  error: string | null;
  @Expose()
  results: ExecutorTestResult[];
  @Expose()
  testcasesPassed?: number;
  @Expose()
  totalTestcases?: number;
}
