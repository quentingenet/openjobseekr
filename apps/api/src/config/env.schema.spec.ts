import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.schema.js';

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/openjobseekr',
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRES_IN: '1d',
  FOLLOW_UP_DELAY_DAYS: '7',
  PORT: '3000',
};

describe('validateEnv', () => {
  it('parses a valid environment and coerces numbers', () => {
    expect(validateEnv(validEnv)).toEqual({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/openjobseekr',
      JWT_SECRET: 'a'.repeat(32),
      JWT_EXPIRES_IN: '1d',
      FOLLOW_UP_DELAY_DAYS: 7,
      PORT: 3000,
    });
  });

  it('applies defaults for FOLLOW_UP_DELAY_DAYS and PORT', () => {
    const { FOLLOW_UP_DELAY_DAYS, PORT, ...rest } = validEnv;
    const env = validateEnv(rest);
    expect(env.FOLLOW_UP_DELAY_DAYS).toBe(7);
    expect(env.PORT).toBe(3000);
  });

  it('ignores unrelated variables', () => {
    expect(validateEnv({ ...validEnv, HOME: '/home/someone' })).not.toHaveProperty('HOME');
  });

  it('fails fast when a required variable is missing', () => {
    const { DATABASE_URL, ...rest } = validEnv;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('rejects a short JWT secret', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: 'short' })).toThrow(
      'JWT_SECRET must be at least 32 characters long',
    );
  });

  it('rejects a malformed JWT_EXPIRES_IN', () => {
    expect(() => validateEnv({ ...validEnv, JWT_EXPIRES_IN: 'tomorrow' })).toThrow(
      /JWT_EXPIRES_IN/,
    );
  });

  it('rejects a non-PostgreSQL DATABASE_URL', () => {
    expect(() => validateEnv({ ...validEnv, DATABASE_URL: 'mysql://localhost/db' })).toThrow(
      /DATABASE_URL/,
    );
  });
});
