import { Module } from '@nestjs/common';
import { FollowUpModule } from '../follow-up/follow-up.module.js';
import { SettingsController } from './settings.controller.js';

@Module({
  imports: [FollowUpModule],
  controllers: [SettingsController],
})
export class SettingsModule {}
