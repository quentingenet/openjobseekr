import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AppException } from '../common/app.exception.js';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator.js';
import { ErrorCode } from '../common/error-codes.js';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill-input.dto.js';
import { SkillDto, SkillStatsDto } from './dto/skill-response.dto.js';
import { SkillsService } from './skills.service.js';

const idPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new AppException(
      ErrorCode.VALIDATION_FAILED,
      'Request validation failed',
      HttpStatus.BAD_REQUEST,
      [{ field: 'id', constraints: ['isUuid'] }],
    ),
});

@ApiTags('skills')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'UNAUTHORIZED' })
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'List skills, by name' })
  @ApiOkResponse({ type: [SkillDto] })
  list(@CurrentUser() user: AuthenticatedUser): Promise<SkillDto[]> {
    return this.skills.list(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'How often each skill appears in the saved job postings' })
  @ApiOkResponse({ type: SkillStatsDto })
  stats(@CurrentUser() user: AuthenticatedUser): Promise<SkillStatsDto> {
    return this.skills.stats(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a skill' })
  @ApiCreatedResponse({ type: SkillDto })
  @ApiBadRequestResponse({ description: 'VALIDATION_FAILED' })
  @ApiConflictResponse({ description: 'SKILL_NAME_ALREADY_USED' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSkillDto): Promise<SkillDto> {
    return this.skills.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a skill' })
  @ApiOkResponse({ type: SkillDto })
  @ApiBadRequestResponse({ description: 'VALIDATION_FAILED' })
  @ApiNotFoundResponse({ description: 'SKILL_NOT_FOUND' })
  @ApiConflictResponse({ description: 'SKILL_NAME_ALREADY_USED' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', idPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillDto> {
    return this.skills.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a skill' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'SKILL_NOT_FOUND' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', idPipe) id: string): Promise<void> {
    return this.skills.remove(user.id, id);
  }
}
