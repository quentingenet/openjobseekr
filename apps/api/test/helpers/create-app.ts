import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
}

/** Boots the real application (same global pipes and filters as `main.ts`). */
export async function createTestApp(
  options: { beforeInit?: (app: INestApplication) => void } = {},
): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = configureApp(moduleRef.createNestApplication());
  options.beforeInit?.(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

/** Empties every table between tests. Table names are constants, not user input. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRaw`TRUNCATE TABLE "Skill", "Application", "User" RESTART IDENTITY CASCADE`;
}
