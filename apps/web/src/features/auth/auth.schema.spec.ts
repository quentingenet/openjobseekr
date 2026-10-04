import { describe, expect, it } from 'vitest';
import { credentialsSchema } from './auth.schema';

const issues = (email: string, password: string) =>
  credentialsSchema.safeParse({ email, password }).error?.issues.map((issue) => issue.message) ??
  [];

describe('credentialsSchema', () => {
  it('accepts a valid email and password, normalized like the API', () => {
    expect(credentialsSchema.parse({ email: ' Jane@Example.com ', password: '12345678' })).toEqual({
      email: 'jane@example.com',
      password: '12345678',
    });
  });

  it('rejects an email longer than 254 characters, like the API', () => {
    expect(issues(`${'a'.repeat(243)}@example.com`, '12345678')).toEqual(['validation.tooLong']);
  });

  it('rejects a password shorter than 8 characters or longer than 72 bytes', () => {
    expect(issues('jane@example.com', '1234567')).toEqual(['validation.passwordTooShort']);
    // 37 two-byte characters = 74 bytes.
    expect(issues('jane@example.com', 'é'.repeat(37))).toEqual(['validation.passwordTooLong']);
  });
});
