import { ApiProperty } from '@nestjs/swagger';
import { CREDENTIAL_LIMITS } from '@openjobseekr/domain';
import { Transform } from 'class-transformer';
import { IsByteLength, IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @ApiProperty({ example: 'jane@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(CREDENTIAL_LIMITS.emailMaxLength)
  email: string;

  // bcrypt only uses the first 72 bytes of a password: reject longer ones instead of
  // silently truncating them.
  @ApiProperty({
    minLength: CREDENTIAL_LIMITS.passwordMinLength,
    description: `At most ${CREDENTIAL_LIMITS.passwordMaxBytes} bytes (UTF-8)`,
  })
  @IsString()
  @MinLength(CREDENTIAL_LIMITS.passwordMinLength)
  @IsByteLength(0, CREDENTIAL_LIMITS.passwordMaxBytes)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jane@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(CREDENTIAL_LIMITS.emailMaxLength)
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @IsByteLength(0, CREDENTIAL_LIMITS.passwordMaxBytes)
  password: string;
}
