import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum Batch {
  X = 'X',
  Y = 'Y',
}

export class RegisterStudentDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @Matches(/^[a-z]+\.[a-z]+\.\d{2}@aot\.edu\.in$/, {
    message:
      'Email must follow the pattern firstname.lastname.batch@aot.edu.in',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toUpperCase())
  roll: string;

  @IsInt()
  @Min(1)
  @Max(8)
  sem: number;

  @IsInt()
  @IsNotEmpty()
  section: number;

  @IsEnum(Batch, { message: 'Batch must be X or Y' })
  batch: Batch;

  @IsString()
  @IsNotEmpty()
  departmentId: string;
}
