import { Expose } from 'class-transformer';

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

export class CreateProblemResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  type: 'Easy' | 'Medium' | 'Hard';

  @Expose()
  points: number;

  @Expose()
  serialNo: number;

  @Expose()
  problemDetailsId: string | null;

  problemDetails: ProblemDetailsResponseDto;
}
