import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ProblemDetailsDto } from './common/problem-details.dto.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';
import { createValidationPipe } from './common/validation.js';

/** Global pipes, filters and lifecycle hooks, shared by `main.ts` and the e2e tests. */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  // Job posting texts can exceed Express' default 100 kB JSON limit.
  app.useBodyParser('json', { limit: '1mb' });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.enableShutdownHooks();
  return app;
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('OpenJobSeekR API')
    .setDescription(
      'Local job application tracker. Errors are RFC 9457 problem details (application/problem+json) with a stable `code`.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config, { extraModels: [ProblemDetailsDto] });
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup('docs', app, () => createOpenApiDocument(app));
}
