import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module.js';
import { SettingsController } from './settings.controller.js';

@Module({
  imports: [ApplicationsModule],
  controllers: [SettingsController],
})
export class SettingsModule {}
