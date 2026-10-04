import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { Env } from '../config/env.schema.js';
import { FollowUpContextProvider } from './follow-up-context.provider.js';

describe('FollowUpContextProvider', () => {
  it('combines the clock and the configured delay', () => {
    const clock = { today: () => '2026-10-09' };
    const config = { get: () => 10 } as unknown as ConfigService<Env, true>;
    const policy = new FollowUpContextProvider(clock, config);

    expect(policy.delayDays).toBe(10);
    expect(policy.context()).toEqual({ today: '2026-10-09', delayDays: 10 });
  });
});
