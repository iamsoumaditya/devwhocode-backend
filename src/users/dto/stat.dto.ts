import { IsInt, IsOptional } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class UserStatsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assignmentId: number;
}

export class ProblemStatDto {
  @Expose()
  problemId: string;
  @Expose()
  problemName: string;
  @Expose()
  problemSlug: string;
  @Expose()
  problemType: string;
  @Expose()
  order: number;
  @Expose()
  attempted: boolean;
  @Expose()
  accepted: boolean;
}

export class StatsResponseDto {
  @Expose()
  assignmentId: number;
  @Expose()
  assignmentName: string;
  @Expose()
  totalProblems: number;
  @Expose()
  attemptedCount: number;
  @Expose()
  acceptedCount: number;
  @Expose()
  attemptedPercentage: number;
  @Expose()
  acceptedPercentage: number;
  @Expose() problems: ProblemStatDto[];
}
