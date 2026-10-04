import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator.js';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe.js';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill-input.dto.js';
import { SkillDto, SkillStatsDto } from './dto/skill-response.dto.js';
import { SkillsService } from './skills.service.js';
import { ApiProblem } from '../common/decorators/api-problem.decorator.js';
import { ErrorCode } from '../common/error-codes.js';

@ApiTags('skills')
@ApiBearerAuth()
@ApiProblem(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
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
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED)
  @ApiProblem(HttpStatus.CONFLICT, ErrorCode.SKILL_NAME_ALREADY_USED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSkillDto): Promise<SkillDto> {
    return this.skills.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a skill' })
  @ApiOkResponse({ type: SkillDto })
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED)
  @ApiProblem(HttpStatus.NOT_FOUND, ErrorCode.SKILL_NOT_FOUND)
  @ApiProblem(HttpStatus.CONFLICT, ErrorCode.SKILL_NAME_ALREADY_USED)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillDto> {
    return this.skills.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a skill' })
  @ApiNoContentResponse()
  @ApiProblem(HttpStatus.NOT_FOUND, ErrorCode.SKILL_NOT_FOUND)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<void> {
    return this.skills.remove(user.id, id);
  }
}
