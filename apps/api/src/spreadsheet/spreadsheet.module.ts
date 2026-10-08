import { Module } from '@nestjs/common';
import { FollowUpModule } from '../follow-up/follow-up.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { ExportController } from './export.controller.js';
import { ExportService } from './export.service.js';
import { ImportController } from './import.controller.js';
import { ImportService } from './import.service.js';

@Module({
  imports: [FollowUpModule, SkillsModule],
  controllers: [ImportController, ExportController],
  providers: [ImportService, ExportService],
})
/** Spreadsheet import and export, in the layout of the job search spreadsheet. */
export class SpreadsheetModule {}
