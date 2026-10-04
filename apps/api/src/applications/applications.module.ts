import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';
import { FollowUpContextProvider } from './follow-up-context.provider.js';

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, FollowUpContextProvider],
  exports: [FollowUpContextProvider],
})
export class ApplicationsModule {}
