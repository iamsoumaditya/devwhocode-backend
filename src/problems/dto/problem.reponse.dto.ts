import { Expose, Type } from 'class-transformer';
import { type ProblemType } from './problem.dto';

export class TestcaseResponseDto {
  @Expose() id: string;
  @Expose() input: string;
  @Expose() output: string;
  @Expose() isPublic: boolean;
}

export class ProblemDetailsResponseDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  hint: string | null;

  @Expose()
  canAttachFile: boolean;

  @Expose()
  isTestcasesAvailable: boolean;
}

export class ProblemResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  type: ProblemType;

  @Expose()
  problemDetailsId: string | null;
}

export class ProblemWithDetailsResponseDto extends ProblemResponseDto {
  @Expose()
  @Type(() => ProblemDetailsResponseDto)
  problemDetails: ProblemDetailsResponseDto;
}

export class ProblemDetailsWithTestcasesDto extends ProblemWithDetailsResponseDto {
  @Expose()
  @Type(() => TestcaseResponseDto)
  testcases: TestcaseResponseDto[];
}

export class ProblemToAssignmentResponseDto {
  @Expose() assignmentId: number;
  @Expose() problemId: string;
  @Expose() order: number;
  @Expose() createdAt:Date
}

export class AssignmentProblemResponseDto {
  @Expose() assignmentId: number;
  @Expose() problemId: string;
  @Expose() order: number;
  @Expose() createdAt: Date;
  @Expose()
  @Type(() => ProblemResponseDto)
  problem: ProblemResponseDto;
}