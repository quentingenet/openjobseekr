import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IMPORT_LIMITS } from '@openjobseekr/domain';
import { ApiProblem } from '../common/decorators/api-problem.decorator.js';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator.js';
import { ErrorCode } from '../common/error-codes.js';
import { ImportResultDto } from './dto/import-result.dto.js';
import { ImportService, type UploadedSpreadsheet } from './import.service.js';

@ApiTags('import')
@ApiBearerAuth()
@ApiProblem(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  // In memory, one file only: the size limit is enforced while receiving it.
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMPORT_LIMITS.maxFileBytes, files: 1, fields: 0 },
    }),
  )
  @ApiOperation({
    summary: 'Import the job search spreadsheet (.xlsx or .ods)',
    description:
      'Replaces all the applications with those of the first sheet, and adds the skills of the "Compétences" sheet that do not exist yet. Nothing changes if the file is rejected.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: ImportResultDto })
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, ErrorCode.BAD_REQUEST)
  @ApiProblem(HttpStatus.PAYLOAD_TOO_LARGE, ErrorCode.PAYLOAD_TOO_LARGE)
  @ApiProblem(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ErrorCode.IMPORT_UNSUPPORTED_FILE)
  @ApiProblem(
    HttpStatus.UNPROCESSABLE_ENTITY,
    ErrorCode.IMPORT_INVALID_STRUCTURE,
    ErrorCode.IMPORT_INVALID_DATA,
    ErrorCode.IMPORT_TOO_MANY_ROWS,
  )
  importSpreadsheet(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedSpreadsheet | undefined,
  ): Promise<ImportResultDto> {
    return this.importService.importSpreadsheet(user.id, file);
  }
}
