import { Injectable } from '@nestjs/common';
import { buildOverview, type Overview } from './domain/overview.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string): Promise<Overview> {
    // The database counts: at most one row per (status, channel) pair, whatever the volume.
    const groups = await this.prisma.application.groupBy({
      by: ['status', 'channel'],
      where: { userId },
      _count: { _all: true },
    });
    return buildOverview(
      groups.map(({ status, channel, _count }) => ({ status, channel, count: _count._all })),
    );
  }
}
