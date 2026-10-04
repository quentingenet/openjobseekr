import { CREDENTIAL_LIMITS } from '@openjobseekr/domain';
import { z } from 'zod';

/** Same rules as the API: valid email, password 8 characters to 72 bytes (bcrypt limit). */
export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'validation.required')
    .max(CREDENTIAL_LIMITS.emailMaxLength, 'validation.tooLong')
    .pipe(z.email('validation.email')),
  password: z
    .string()
    .min(CREDENTIAL_LIMITS.passwordMinLength, 'validation.passwordTooShort')
    .refine(
      (value) => new TextEncoder().encode(value).length <= CREDENTIAL_LIMITS.passwordMaxBytes,
      'validation.passwordTooLong',
    ),
});

export type CredentialsForm = z.infer<typeof credentialsSchema>;
