import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Overview } from './domain/overview.js';
import { ApiProblem } from '../common/decorators/api-problem.decorator.js';
import { ErrorCode } from '../common/error-codes.js';
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
  @ApiProblem(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
  overview(@CurrentUser() user: AuthenticatedUser): Promise<Overview> {
    return this.stats.overview(user.id);
  }
}
