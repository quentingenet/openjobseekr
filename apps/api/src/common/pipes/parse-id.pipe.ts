import { Injectable, ParseUUIDPipe } from '@nestjs/common';
import { AppException } from '../app.exception.js';
import { ErrorCode } from '../error-codes.js';

/** `:id` route parameter: a UUID, or the usual VALIDATION_FAILED error. */
@Injectable()
export class ParseIdPipe extends ParseUUIDPipe {
  constructor() {
    super({
      exceptionFactory: () =>
        new AppException(ErrorCode.VALIDATION_FAILED, undefined, [
          { field: 'id', constraints: ['isUuid'] },
        ]),
    });
  }
}
