import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../common/app.exception.js';
import { ErrorCode } from '../common/error-codes.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { computeSkillStats } from './domain/skill-stats.js';
import type { CreateSkillDto, UpdateSkillDto } from './dto/skill-input.dto.js';
import type { SkillDto, SkillStatsDto } from './dto/skill-response.dto.js';

const skillSelect = { id: true, name: true, pattern: true, level: true } as const;

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<SkillDto[]> {
    return this.prisma.skill.findMany({
      where: { userId },
      select: skillSelect,
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateSkillDto): Promise<SkillDto> {
    try {
      return await this.prisma.skill.create({
        data: { name: dto.name, pattern: dto.pattern, level: dto.level ?? null, userId },
        select: skillSelect,
      });
    } catch (error) {
      throw mapWriteError(error, dto.name);
    }
  }

  async update(userId: string, id: string, dto: UpdateSkillDto): Promise<SkillDto> {
    try {
      return await this.prisma.skill.update({
        where: { id, userId },
        data: dto,
        select: skillSelect,
      });
    } catch (error) {
      throw mapWriteError(error, dto.name, id);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      await this.prisma.skill.delete({ where: { id, userId } });
    } catch (error) {
      throw mapWriteError(error, undefined, id);
    }
  }

  /** Each skill matched against the user's saved job posting texts. */
  async stats(userId: string): Promise<SkillStatsDto> {
    const [skills, applications] = await Promise.all([
      this.list(userId),
      this.prisma.application.findMany({
        where: { userId, jobPostingText: { not: null } },
        select: { jobPostingText: true },
      }),
    ]);
    return computeSkillStats(
      skills,
      applications.map((application) => application.jobPostingText),
    );
  }
}

function mapWriteError(error: unknown, name?: string, id?: string): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new AppException(
        ErrorCode.SKILL_NAME_ALREADY_USED,
        `A skill named "${name ?? ''}" already exists`,
        HttpStatus.CONFLICT,
      );
    }
    if (error.code === 'P2025') {
      return new AppException(
        ErrorCode.SKILL_NOT_FOUND,
        `Skill ${id ?? ''} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
  }
  return error;
}
