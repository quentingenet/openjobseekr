import { Injectable } from '@nestjs/common';
import { AppException } from '../common/app.exception.js';
import { ErrorCode } from '../common/error-codes.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { skillNameKey } from './domain/skill-name.js';
import { computeSkillStats } from './domain/skill-stats.js';
import type { CreateSkillDto, UpdateSkillDto } from './dto/skill-input.dto.js';
import type { SkillDto, SkillStatsDto } from './dto/skill-response.dto.js';

const skillSelect = { id: true, name: true, pattern: true, level: true } as const;

/**
 * Every query is scoped by `userId`. Missing skills, and exact duplicate names that slip past
 * `assertNameAvailable`, are reported by the global error handling (SKILL_NOT_FOUND,
 * SKILL_NAME_ALREADY_USED).
 */
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
    await this.assertNameAvailable(userId, dto.name);
    return this.prisma.skill.create({
      data: { name: dto.name, pattern: dto.pattern, level: dto.level ?? null, userId },
      select: skillSelect,
    });
  }

  async update(userId: string, id: string, dto: UpdateSkillDto): Promise<SkillDto> {
    if (dto.name !== undefined) await this.assertNameAvailable(userId, dto.name, id);
    return this.prisma.skill.update({ where: { id, userId }, data: dto, select: skillSelect });
  }

  /** "typescript" is the same skill as "TypeScript" (see `skillNameKey`). */
  private async assertNameAvailable(userId: string, name: string, exceptId?: string) {
    const others = await this.prisma.skill.findMany({
      where: exceptId === undefined ? { userId } : { userId, id: { not: exceptId } },
      select: { name: true },
    });
    const key = skillNameKey(name);
    if (others.some((skill) => skillNameKey(skill.name) === key)) {
      throw new AppException(ErrorCode.SKILL_NAME_ALREADY_USED);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.prisma.skill.delete({ where: { id, userId } });
  }

  /**
   * Each skill matched against the user's saved job posting texts. Computed on each request
   * (skills × postings, RE2 in linear time): fine for one person's search. A hosted version
   * would store the matches when a posting or a skill changes instead.
   */
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
