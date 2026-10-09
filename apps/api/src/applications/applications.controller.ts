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
  Query,
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
import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application-input.dto.js';
import { ApplicationDetailDto, ApplicationListDto } from './dto/application-response.dto.js';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto.js';
import { ApiProblem } from '../common/decorators/api-problem.decorator.js';
import { ErrorCode } from '../common/error-codes.js';

@ApiTags('applications')
@ApiBearerAuth()
@ApiProblem(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an application' })
  @ApiCreatedResponse({ type: ApplicationDetailDto })
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApplicationDto,
  ): Promise<ApplicationDetailDto> {
    return this.applications.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List applications (without the job posting text), newest first' })
  @ApiOkResponse({ type: ApplicationListDto })
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListApplicationsQueryDto,
  ): Promise<ApplicationListDto> {
    return this.applications.list(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an application, including the job posting text' })
  @ApiOkResponse({ type: ApplicationDetailDto })
  @ApiProblem(HttpStatus.NOT_FOUND, ErrorCode.APPLICATION_NOT_FOUND)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<ApplicationDetailDto> {
    return this.applications.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update some fields of an application' })
  @ApiOkResponse({ type: ApplicationDetailDto })
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED)
  @ApiProblem(HttpStatus.NOT_FOUND, ErrorCode.APPLICATION_NOT_FOUND)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: UpdateApplicationDto,
  ): Promise<ApplicationDetailDto> {
    return this.applications.update(user.id, id, dto);
  }

  @Post(':id/follow-ups')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record that the user followed up today; the next follow-up comes one delay later',
  })
  @ApiOkResponse({ type: ApplicationDetailDto })
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED)
  @ApiProblem(HttpStatus.NOT_FOUND, ErrorCode.APPLICATION_NOT_FOUND)
  @ApiProblem(HttpStatus.CONFLICT, ErrorCode.FOLLOW_UP_NOT_EXPECTED)
  recordFollowUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<ApplicationDetailDto> {
    return this.applications.recordFollowUp(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an application' })
  @ApiNoContentResponse()
  @ApiProblem(HttpStatus.NOT_FOUND, ErrorCode.APPLICATION_NOT_FOUND)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<void> {
    return this.applications.remove(user.id, id);
  }
}
