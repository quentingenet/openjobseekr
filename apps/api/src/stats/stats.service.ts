import { Injectable } from '@nestjs/common';
import { buildOverview, type Overview } from '../applications/domain/overview.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string): Promise<Overview> {
    const applications = await this.prisma.application.findMany({
      where: { userId },
      select: { status: true, channel: true },
    });
    return buildOverview(applications);
  }
}
