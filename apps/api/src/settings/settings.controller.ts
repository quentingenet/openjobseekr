import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Env } from '../config/env.schema.js';

export class SettingsDto {
  @ApiProperty({ example: 7, description: 'Days between sending an application and following up' })
  followUpDelayDays: number;
}

/** Read-only settings the web app needs (e.g. to preview the follow-up date). */
@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Get()
  @ApiOperation({ summary: 'Settings used by the web app' })
  @ApiOkResponse({ type: SettingsDto })
  @ApiUnauthorizedResponse({ description: 'UNAUTHORIZED' })
  get(): SettingsDto {
    return { followUpDelayDays: this.config.get('FOLLOW_UP_DELAY_DAYS', { infer: true }) };
  }
}
