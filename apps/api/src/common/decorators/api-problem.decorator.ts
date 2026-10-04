import type { HttpStatus } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import type { ErrorCode } from '../error-codes.js';
import { PROBLEM_CONTENT_TYPE } from '../problem-details.js';
import { ProblemDetailsDto } from '../problem-details.dto.js';

/** Documents an error response: RFC 9457 problem details with the possible codes. */
export function ApiProblem(
  status: HttpStatus,
  ...codes: ErrorCode[]
): MethodDecorator & ClassDecorator {
  return ApiResponse({
    status,
    description: codes.join(', '),
    content: { [PROBLEM_CONTENT_TYPE]: { schema: { $ref: getSchemaPath(ProblemDetailsDto) } } },
  });
}
