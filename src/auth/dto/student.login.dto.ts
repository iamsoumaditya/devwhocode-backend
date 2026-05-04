import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginStudentDto {
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
}
