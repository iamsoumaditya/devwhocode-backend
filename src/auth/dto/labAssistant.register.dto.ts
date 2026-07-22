import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterLabAssistantDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @Matches(/^[\w.+-]+@aot\.edu\.in$/, {
    message: 'Email must be a Aot mail',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(25, { message: 'Password must not exceed 25 characters' }) // otherwise if password is too long it would take too long to hash and compare
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsInt()
  @Min(1)
  labId: number;
}
