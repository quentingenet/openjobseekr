import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller.js';
import { SkillsService } from './skills.service.js';

@Module({
  controllers: [SkillsController],
  providers: [SkillsService],
  // The spreadsheet export writes the skill frequencies.
  exports: [SkillsService],
})
export class SkillsModule {}
