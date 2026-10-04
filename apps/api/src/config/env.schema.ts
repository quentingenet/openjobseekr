import { z } from 'zod';

/** A duration such as `15m`, `12h` or `1d`: the format the JWT library expects. */
export type JwtExpiresIn = `${number}${'s' | 'm' | 'h' | 'd'}`;

/** Environment variables used by the API. Validated once at startup (fail fast). */
export const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.custom<JwtExpiresIn>(
    (value) => typeof value === 'string' && /^\d+[smhd]$/.test(value),
    'JWT_EXPIRES_IN must look like 15m, 12h or 1d',
  ),
  FOLLOW_UP_DELAY_DAYS: z.coerce.number().int().min(0).default(7),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  // Login and registration attempts per minute and per IP address (brute force protection).
  AUTH_RATE_LIMIT: z.coerce.number().int().min(1).default(5),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
