import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token, sent as `Authorization: Bearer <token>`' })
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
