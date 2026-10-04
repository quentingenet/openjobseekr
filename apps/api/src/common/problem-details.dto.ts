import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from './error-codes.js';
import type { ProblemDetails } from './problem-details.js';

class FieldErrorDto {
  @ApiProperty({ example: 'company' })
  field: string;

  @ApiProperty({ example: ['isNotEmpty'], description: 'Failed constraint names, sorted' })
  constraints: string[];
}

/** OpenAPI description of every error response (RFC 9457, application/problem+json). */
export class ProblemDetailsDto implements ProblemDetails {
  @ApiProperty({ example: 'urn:openjobseekr:error:application-not-found' })
  type: string;

  @ApiProperty({ example: 'Application not found' })
  title: string;

  @ApiProperty({ example: 404 })
  status: number;

  @ApiPropertyOptional({ description: 'Developer message about this occurrence' })
  detail?: string;

  @ApiProperty({ example: '/applications/6c3f4d2e-0000-4000-8000-000000000001' })
  instance: string;

  @ApiProperty({ enum: ErrorCode, description: 'Stable code, translated by the web app' })
  code: ErrorCode;

  @ApiPropertyOptional({ type: [FieldErrorDto], description: 'Invalid fields (VALIDATION_FAILED)' })
  errors?: FieldErrorDto[];
}
