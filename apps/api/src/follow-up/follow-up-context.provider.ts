import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Clock } from '../common/clock.js';
import type { Env } from '../config/env.schema.js';

/** Inputs of the follow-up rule: today's date and the configured delay. */
export interface FollowUpContext {
  today: string;
  delayDays: number;
}

/** Builds the follow-up context from the clock and the validated configuration. */
@Injectable()
export class FollowUpContextProvider {
  constructor(
    private readonly clock: Clock,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get delayDays(): number {
    return this.config.get('FOLLOW_UP_DELAY_DAYS', { infer: true });
  }

  context(): FollowUpContext {
    return { today: this.clock.today(), delayDays: this.delayDays };
  }
}
