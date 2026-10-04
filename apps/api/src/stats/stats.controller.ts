import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Overview } from '../applications/domain/overview.js';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator.js';
import { StatsOverviewDto } from './dto/stats-overview.dto.js';
import { StatsService } from './stats.service.js';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Counts by status and channel, and the response rate' })
  @ApiOkResponse({ type: StatsOverviewDto })
  @ApiUnauthorizedResponse({ description: 'UNAUTHORIZED' })
  overview(@CurrentUser() user: AuthenticatedUser): Promise<Overview> {
    return this.stats.overview(user.id);
  }
}
