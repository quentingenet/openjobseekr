import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { fileURLToPath } from 'node:url';
import { validateEnv } from './env.schema.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // The .env file lives at the repository root; real environment variables take precedence.
      envFilePath: fileURLToPath(new URL('../../../../.env', import.meta.url)),
      validate: validateEnv,
    }),
  ],
})
export class ConfigModule {}
