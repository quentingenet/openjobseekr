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
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application-input.dto.js';
import { ApplicationDetailDto, ApplicationListDto } from './dto/application-response.dto.js';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto.js';

/** `:id` must be a UUID; otherwise the usual VALIDATION_FAILED error is returned. */
const idPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new AppException(
      ErrorCode.VALIDATION_FAILED,
      'Request validation failed',
      HttpStatus.BAD_REQUEST,
      [{ field: 'id', constraints: ['isUuid'] }],
    ),
});

@ApiTags('applications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'UNAUTHORIZED' })
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an application' })
  @ApiCreatedResponse({ type: ApplicationDetailDto })
  @ApiBadRequestResponse({ description: 'VALIDATION_FAILED' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApplicationDto,
  ): Promise<ApplicationDetailDto> {
    return this.applications.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List applications (without the job posting text), newest first' })
  @ApiOkResponse({ type: ApplicationListDto })
  @ApiBadRequestResponse({ description: 'VALIDATION_FAILED' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListApplicationsQueryDto,
  ): Promise<ApplicationListDto> {
    return this.applications.list(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an application, including the job posting text' })
  @ApiOkResponse({ type: ApplicationDetailDto })
  @ApiNotFoundResponse({ description: 'APPLICATION_NOT_FOUND' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', idPipe) id: string,
  ): Promise<ApplicationDetailDto> {
    return this.applications.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update some fields of an application' })
  @ApiOkResponse({ type: ApplicationDetailDto })
  @ApiBadRequestResponse({ description: 'VALIDATION_FAILED' })
  @ApiNotFoundResponse({ description: 'APPLICATION_NOT_FOUND' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', idPipe) id: string,
    @Body() dto: UpdateApplicationDto,
  ): Promise<ApplicationDetailDto> {
    return this.applications.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an application' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'APPLICATION_NOT_FOUND' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', idPipe) id: string): Promise<void> {
    return this.applications.remove(user.id, id);
  }
}
