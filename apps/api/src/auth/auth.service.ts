import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { AppException } from '../common/app.exception.js';
import { ErrorCode } from '../common/error-codes.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto.js';
import type { LoginDto, RegisterDto } from './dto/credentials.dto.js';

export const BCRYPT_COST = 12;

export interface JwtPayload {
  sub: string;
  email: string;
}

interface UserRecord {
  id: string;
  email: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  // Compared against when the email is unknown, so both login failures take the same time.
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    // A duplicate email is reported as EMAIL_ALREADY_USED by the global error handling.
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const passwordMatches = await bcrypt.compare(dto.password, hash);
    if (!user || !passwordMatches) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }
    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    });
    if (!user) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'User no longer exists');
    }
    return toUserResponse(user);
  }

  private async buildAuthResponse(user: UserRecord): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return { accessToken: await this.jwt.signAsync(payload), user: toUserResponse(user) };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= bcrypt.hash('dummy-password-for-timing', BCRYPT_COST);
    return this.dummyHash;
  }
}

/** Only public fields: the password hash never leaves the service. */
function toUserResponse(user: UserRecord): UserResponseDto {
  return { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() };
}
