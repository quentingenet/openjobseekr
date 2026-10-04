import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { Clock } from '../../src/common/clock.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
}

/** Boots the real application (same global pipes and filters as `main.ts`). */
export async function createTestApp(
  options: { beforeInit?: (app: INestApplication) => void; today?: string } = {},
): Promise<TestApp> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (options.today) {
    const today = options.today;
    builder = builder.overrideProvider(Clock).useValue({ today: () => today });
  }
  const moduleRef = await builder.compile();
  const app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
  options.beforeInit?.(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

/** Empties every table between tests. Table names are constants, not user input. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRaw`TRUNCATE TABLE "Skill", "Application", "User" RESTART IDENTITY CASCADE`;
}
