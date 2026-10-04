import { Controller, Get } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { FollowUpContextProvider } from '../applications/follow-up-context.provider.js';
import { ApiProblem } from '../common/decorators/api-problem.decorator.js';
import { ErrorCode } from '../common/error-codes.js';

export class SettingsDto {
  @ApiProperty({ example: 7, description: 'Days between sending an application and following up' })
  followUpDelayDays: number;
}

/** Read-only settings the web app needs (e.g. to preview the follow-up date). */
@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly followUp: FollowUpContextProvider) {}

  @Get()
  @ApiOperation({ summary: 'Settings used by the web app' })
  @ApiOkResponse({ type: SettingsDto })
  @ApiProblem(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
  get(): SettingsDto {
    return { followUpDelayDays: this.followUp.delayDays };
  }
}
