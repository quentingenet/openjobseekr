import { Controller, Get, HttpStatus, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ApiProblem } from '../common/decorators/api-problem.decorator.js';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator.js';
import { ErrorCode } from '../common/error-codes.js';
import { ExportQueryDto } from './dto/export-query.dto.js';
import { ExportService } from './export.service.js';
import { SPREADSHEET_CONTENT_TYPES } from './spreadsheet-writer.js';

@ApiTags('export')
@ApiBearerAuth()
@ApiProblem(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  @ApiOperation({
    summary: 'Export the applications and skills as a spreadsheet (.xlsx or .ods)',
    description:
      'Same sheets and columns as the import: exporting then importing gives back the same data.',
  })
  @ApiProduces(...Object.values(SPREADSHEET_CONTENT_TYPES))
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED)
  async exportSpreadsheet(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ExportQueryDto,
  ): Promise<StreamableFile> {
    const file = await this.exportService.exportSpreadsheet(user.id, query.format);
    return new StreamableFile(file.content, {
      type: file.contentType,
      disposition: `attachment; filename="${file.fileName}"`,
    });
  }
}
