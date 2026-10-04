import { Injectable } from '@nestjs/common';
import { toCalendarDate } from '@openjobseekr/domain';

/** Source of "today". Injected so that tests can fix the date. */
@Injectable()
export class Clock {
  /** Today's date in the machine's local time zone, as `YYYY-MM-DD`. */
  today(): string {
    return toCalendarDate(new Date());
  }
}
