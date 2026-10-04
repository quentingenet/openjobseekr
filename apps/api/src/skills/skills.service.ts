import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { computeSkillStats } from './domain/skill-stats.js';
import type { CreateSkillDto, UpdateSkillDto } from './dto/skill-input.dto.js';
import type { SkillDto, SkillStatsDto } from './dto/skill-response.dto.js';

const skillSelect = { id: true, name: true, pattern: true, level: true } as const;

/**
 * Every query is scoped by `userId`. Duplicate names and missing skills are reported by the
 * global error handling (SKILL_NAME_ALREADY_USED, SKILL_NOT_FOUND).
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

  create(userId: string, dto: CreateSkillDto): Promise<SkillDto> {
    return this.prisma.skill.create({
      data: { name: dto.name, pattern: dto.pattern, level: dto.level ?? null, userId },
      select: skillSelect,
    });
  }

  update(userId: string, id: string, dto: UpdateSkillDto): Promise<SkillDto> {
    return this.prisma.skill.update({ where: { id, userId }, data: dto, select: skillSelect });
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
