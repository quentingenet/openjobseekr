import { Module } from '@nestjs/common';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ClockModule } from './common/clock.module.js';
import { ConfigModule } from './config/config.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { StatsModule } from './stats/stats.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ClockModule,
    AuthModule,
    HealthModule,
    ApplicationsModule,
    StatsModule,
    SettingsModule,
    SkillsModule,
  ],
})
export class AppModule {}
