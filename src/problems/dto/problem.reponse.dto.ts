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
  points: number;

  @Expose()
  serialNo: number;

  @Expose()
  problemDetailsId: string | null;
}

export class ProblemWithDetailsResponseDto extends ProblemResponseDto {
  @Expose()
  problemDetails: ProblemDetailsResponseDto;
}

export class ProblemWithTestcasesDto extends ProblemResponseDto {
  @Expose()
  @Type(() => TestcaseResponseDto)
  testcases: TestcaseResponseDto[];
}

export class ProblemDetailsWithTestcasesDto extends ProblemDetailsResponseDto {
  @Expose()
  @Type(() => TestcaseResponseDto)
  testcases: TestcaseResponseDto[];
}