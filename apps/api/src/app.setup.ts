import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { createValidationPipe } from './common/validation.js';

/** Global pipes, filters and lifecycle hooks, shared by `main.ts` and the e2e tests. */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  // Job posting texts can exceed Express' default 100 kB JSON limit.
  app.useBodyParser('json', { limit: '1mb' });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  return app;
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('OpenJobSeekR API')
    .setDescription('Local job application tracker. Errors use { code, message, details? }.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));
}
