import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginLabAssistantDto {

  @IsEmail({}, { message: 'Invalid email address' })
  @Matches(/^[\w.+-]+@aot\.edu\.in$/, {
    message: 'Email must be a Aot mail',
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
