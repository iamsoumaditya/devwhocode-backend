import { IsOptional, IsIn, IsInt, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import {
  CODE_EXECUTION_STATUS,
  RESULT_OF_EXECUTION,
} from '../../execute/constant';

export class UserRunsDto {
  @IsOptional()
  @IsUUID()
  problemId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  labId?: number;

  @IsOptional()
  @IsIn(CODE_EXECUTION_STATUS)
  status?: string;

  @IsOptional()
  @IsIn(RESULT_OF_EXECUTION)
  result?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;
}

export class UserSubmitsDto {
  @IsOptional()
  @IsUUID()
  problemId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  labId?: number;

  @IsOptional()
  @IsIn(CODE_EXECUTION_STATUS)
  status?: string;

  @IsOptional()
  @IsIn(RESULT_OF_EXECUTION)
  result?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;
}

export class UserExecuteDataDto {
  id: string;
  code: string;
  status: (typeof CODE_EXECUTION_STATUS)[number];
  result: (typeof RESULT_OF_EXECUTION)[number] | null;
  error: string | null;
  executionTime: number | null;
  createdAt: Date;
  updatedAt: Date;
  languageId: number | null;
  language: string | null;
  problemId: string;
  problemTitle: string;
  labId: number;
}

export class UserRunsDataDto extends UserExecuteDataDto {
  runCount: number;
}

export class UserSubmitsDataDto extends UserExecuteDataDto {
  submitCount: number;
}
export class UserExecuteMetadataDto {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
export class UserRunsResponseDto extends UserExecuteMetadataDto {
  data: UserRunsDataDto[];
}
export class UserSubmitsResponseDto extends UserExecuteMetadataDto {
  data: UserSubmitsDataDto[];
}
