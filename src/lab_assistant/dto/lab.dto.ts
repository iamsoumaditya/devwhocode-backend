import { Expose } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class LabDto {
  @IsString()
  name: string;
}

export class LabResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}
