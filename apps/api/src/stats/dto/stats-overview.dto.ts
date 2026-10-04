import { ApiProperty } from '@nestjs/swagger';
import type { Overview } from '../../applications/domain/overview.js';

export class StatsOverviewDto implements Overview {
  @ApiProperty()
  total: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Count per status code; every code is present',
    example: { SENT: 4, HR_INTERVIEW: 1, REJECTED: 1 },
  })
  byStatus: Overview['byStatus'];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Count per channel code; UNSPECIFIED counts applications without a channel',
    example: { LINKEDIN: 3, APEC: 2, UNSPECIFIED: 1 },
  })
  byChannel: Overview['byChannel'];

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Responses / total (not rounded); null without applications',
  })
  responseRate: number | null;
}
