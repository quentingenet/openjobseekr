import { Injectable } from '@nestjs/common';
import { fromDbDate, toApplicationCreateData } from '../applications/application.mapper.js';
import { AppException } from '../common/app.exception.js';
import { ErrorCode } from '../common/error-codes.js';
import { FollowUpContextProvider } from '../follow-up/follow-up-context.provider.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { keepFollowUpDates } from './domain/keep-follow-up-dates.js';
import { parseWorkbook } from './domain/parse-workbook.js';
import { selectNewSkills } from './domain/select-new-skills.js';
import type { ImportResultDto } from './dto/import-result.dto.js';
import { importFailure } from './import-errors.js';
import { readSpreadsheet } from './spreadsheet-reader.js';

export interface UploadedSpreadsheet {
  originalname: string;
  buffer: Buffer;
}

/** Deleting and inserting a few thousand rows: more than Prisma's 5 s default. */
const TRANSACTION_TIMEOUT_MS = 30_000;

/**
 * Imports the job search spreadsheet: its applications replace all the user's applications,
 * its skills are added to the user's skills, and the follow-up dates picked in the app are kept
 * (see `keepFollowUpDates`). The whole file is validated first, then written in one
 * transaction: a rejected file, or a failure while writing, changes nothing.
 */
@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly followUp: FollowUpContextProvider,
  ) {}

  async importSpreadsheet(
    userId: string,
    file: UploadedSpreadsheet | undefined,
  ): Promise<ImportResultDto> {
    if (!file) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'A spreadsheet file is required', [
        { field: 'file', constraints: ['isNotEmpty'] },
      ]);
    }
    const workbook = readSpreadsheet(file.buffer, file.originalname);
    if (!workbook) throw new AppException(ErrorCode.IMPORT_UNSUPPORTED_FILE);
    const parsed = parseWorkbook(workbook, { followUpDelayDays: this.followUp.delayDays });
    if (!parsed.ok) throw importFailure(parsed);

    return this.prisma.$transaction(
      async (tx) => {
        const existingSkills = await tx.skill.findMany({
          where: { userId },
          select: { name: true },
        });
        const skills = selectNewSkills(
          existingSkills.map((skill) => skill.name),
          parsed.skills,
        );
        const previous = await tx.application.findMany({
          where: { userId },
          select: { sentAt: true, company: true, jobTitle: true, followUpOverride: true },
        });
        const followUps = keepFollowUpDates(
          parsed.applications,
          previous.map((application) => ({
            ...application,
            sentAt: fromDbDate(application.sentAt),
            followUpOverride: application.followUpOverride
              ? fromDbDate(application.followUpOverride)
              : null,
          })),
        );
        const deleted = await tx.application.deleteMany({ where: { userId } });
        const imported = await tx.application.createMany({
          data: followUps.applications.map((application) =>
            toApplicationCreateData(application, userId),
          ),
        });
        await tx.skill.createMany({ data: skills.added.map((skill) => ({ ...skill, userId })) });
        return {
          deletedApplications: deleted.count,
          importedApplications: imported.count,
          addedSkills: skills.added.length,
          ignoredSkills: skills.ignored,
          keptFollowUpDates: followUps.kept,
        };
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );
  }
}
