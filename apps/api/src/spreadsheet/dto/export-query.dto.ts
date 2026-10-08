import { ApiProperty } from '@nestjs/swagger';
import { SPREADSHEET_FORMATS, type SpreadsheetFormat } from '@openjobseekr/domain';
import { IsIn } from 'class-validator';

export class ExportQueryDto {
  @ApiProperty({ enum: SPREADSHEET_FORMATS, example: 'xlsx' })
  @IsIn(SPREADSHEET_FORMATS)
  format: SpreadsheetFormat;
}
