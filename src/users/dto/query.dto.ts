import { IsOptional, IsIn, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BATCH_ENUM } from '../constant';

export class UsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  section?: number;

  @IsOptional()
  @IsIn(BATCH_ENUM)
  batch?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  sem?: number;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UsersQueryDataDto {
  id: string;
  name: string;
  email: string;
  sem: number;
  roll: string;
  section: number;
  batch: (typeof BATCH_ENUM)[number];
  score: number;
  departmentId: string | null;
  departmentName: string | null;
}

export class UsersQueryResponseDto {
  data: UsersQueryDataDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
