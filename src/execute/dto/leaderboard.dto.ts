import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsNotEmpty, Min } from 'class-validator';

export enum CollectionType {
  RUN = 'run',
  SUBMIT = 'submit',
}

export class LeaderboardDto {
  @IsEnum(CollectionType)
  type: CollectionType;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  labId: number;

  @IsISO8601()
  @IsNotEmpty()
  startTime: string;
}

export class LeaderboardEntry {
  @Expose()
  rank: number;
  @Expose()
  userId: string;
  @Expose()
  userName: string | null;
  @Expose()
  userEmail: string | null;
  @Expose()
  score: number;
  @Expose()
  totalAttempts: number;
  @Expose()
  totalAccepted: number;
  @Expose()
  totalTestcasesPassed: number;
  @Expose()
  avgExecutionTime: number;
  @Expose()
  firstSubmissionAt: Date;
  @Expose()
  problemBreakdown: {
    problemId: string;
    problemName: string | null;
    attempts: number;
    result: string | null;
    testcasesPassed: number | null;
    totalTestcases: number | null;
    executionTime: number | null;
    score: number;
  }[];
}

export class LeaderboardResponseDto {
  @Expose()
  labId: number;
  @Expose()
  type: CollectionType;
  @Expose()
  startTime: string;
  @Expose()
  generatedAt: string;
  @Expose()
  entries: LeaderboardEntry[];
}
