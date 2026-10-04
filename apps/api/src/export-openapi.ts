import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'node:fs';
import { AppModule } from './app.module.js';
import { createOpenApiDocument } from './app.setup.js';

/**
 * Writes the OpenAPI document to the file given as argument, without starting the server or
 * connecting to the database. The web app generates its API types from this file.
 */
async function exportOpenApi(outputPath: string): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  const document = createOpenApiDocument(app);
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

const outputPath = process.argv[2];
if (!outputPath) {
  throw new Error('Usage: node dist/export-openapi.js <output.json>');
}
await exportOpenApi(outputPath);
