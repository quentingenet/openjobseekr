import { Module } from '@nestjs/common';
import { FollowUpModule } from '../follow-up/follow-up.module.js';
import { ImportController } from './import.controller.js';
import { ImportService } from './import.service.js';

@Module({
  imports: [FollowUpModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
