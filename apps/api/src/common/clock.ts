import { Injectable } from '@nestjs/common';

/** Source of "today". Injected so that tests can fix the date. */
@Injectable()
export class Clock {
  /** Today's date in the machine's local time zone, as `YYYY-MM-DD`. */
  today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
