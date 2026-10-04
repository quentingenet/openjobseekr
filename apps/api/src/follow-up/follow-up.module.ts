import { Module } from '@nestjs/common';
import { FollowUpContextProvider } from './follow-up-context.provider.js';

/** Today's date and the follow-up delay, shared by the applications and settings modules. */
@Module({
  providers: [FollowUpContextProvider],
  exports: [FollowUpContextProvider],
})
export class FollowUpModule {}
