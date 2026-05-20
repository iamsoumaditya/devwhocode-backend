import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StatGroupBy {
  MONTH = 'month',
  DEPT = 'dept',
  SEMESTER = 'semester',
  BATCH = 'batch',
}

export enum StatCollectionType {
  RUN = 'run',
  SUBMIT = 'submit',
  BOTH = 'both',
}

export class StatsDto {
  @IsEnum(StatGroupBy)
  groupBy: StatGroupBy;

  @IsEnum(StatCollectionType)
  @IsOptional()
  collectionType?: StatCollectionType = StatCollectionType.BOTH;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  labId?: number;

  @IsOptional()
  @IsString()
  problemId?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class StatResultDto {
  groupBy: StatGroupBy;
  collectionType: StatCollectionType;
  data: {
    group: string;
    runCount: number;
    submitCount: number;
    acceptedCount: number;
    totalCount: number;
  }[];
}
