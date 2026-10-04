import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PROBLEM_CONTENT_TYPE, toProblemDetails } from './problem-details.js';

/** Every error leaves the API here, as `application/problem+json` (RFC 9457). */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const problem = toProblemDetails(exception, request.path);
    if (problem.status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    http.getResponse<Response>().status(problem.status).type(PROBLEM_CONTENT_TYPE).json(problem);
  }
}
