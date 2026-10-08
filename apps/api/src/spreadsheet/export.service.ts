import { Injectable } from '@nestjs/common';
import type { SpreadsheetFormat } from '@openjobseekr/domain';
import { toApplicationDetail } from '../applications/application.mapper.js';
import { FollowUpContextProvider } from '../follow-up/follow-up-context.provider.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SkillsService } from '../skills/skills.service.js';
import { buildWorkbook } from './domain/build-workbook.js';
import { SPREADSHEET_CONTENT_TYPES, writeSpreadsheet } from './spreadsheet-writer.js';

export interface SpreadsheetFile {
  content: Buffer;
  fileName: string;
  contentType: string;
}

/**
 * Exports the user's applications and skills in the layout of the job search spreadsheet: the
 * file the import reads, so that export then import gives back the same data.
 */
@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly followUp: FollowUpContextProvider,
    private readonly skills: SkillsService,
  ) {}

  async exportSpreadsheet(userId: string, format: SpreadsheetFormat): Promise<SpreadsheetFile> {
    const context = this.followUp.context();
    const [applications, skillStats] = await Promise.all([
      this.prisma.application.findMany({
        where: { userId },
        // Oldest first, like the sheet; the id breaks ties for a stable file.
        orderBy: [{ sentAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      }),
      this.skills.stats(userId),
    ]);
    const sheets = buildWorkbook({
      applications: applications.map((application) => toApplicationDetail(application, context)),
      skills: skillStats.skills,
      postingsAnalyzed: skillStats.postingsAnalyzed,
      followUpDelayDays: context.delayDays,
    });
    return {
      content: writeSpreadsheet(sheets, format),
      fileName: `suivi_candidatures_${context.today}.${format}`,
      contentType: SPREADSHEET_CONTENT_TYPES[format],
    };
  }
}
