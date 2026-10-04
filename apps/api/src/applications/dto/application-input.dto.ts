import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateBy } from 'class-validator';
import {
  IsCalendarDate,
  IsOptionalNotNull,
} from '../../common/decorators/validation.decorators.js';
import { Trim, TrimToNull } from '../../common/transforms.js';
import { Channel, Status, WorkMode } from '../../generated/prisma/enums.js';

/** Maximum text lengths. The web form uses the same values. */
export const TEXT_LIMITS = {
  short: 200,
  medium: 1_000,
  long: 10_000,
  jobPostingText: 50_000,
} as const;

/** A precision is only allowed with the OTHER channel, sent in the same request. */
const RequiresOtherChannel = (): PropertyDecorator =>
  ValidateBy({
    name: 'requiresOtherChannel',
    validator: {
      validate: (value: unknown, args) =>
        value === null ||
        value === undefined ||
        (args?.object as { channel?: unknown }).channel === Channel.OTHER,
      defaultMessage: () => '$property is only allowed when channel is OTHER',
    },
  });

/** Fields in the spreadsheet column order. `null` clears an optional field. */
export class CreateApplicationDto {
  @ApiProperty({ example: '2026-10-01', description: 'YYYY-MM-DD' })
  @IsCalendarDate()
  sentAt: string;

  @ApiProperty({ maxLength: TEXT_LIMITS.short })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_LIMITS.short)
  company: string;

  @ApiProperty({ maxLength: TEXT_LIMITS.short })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_LIMITS.short)
  jobTitle: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.short })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.short)
  location?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.medium })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.medium)
  response?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.medium })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.medium)
  resources?: string | null;

  @ApiPropertyOptional({ enum: Channel, nullable: true })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: TEXT_LIMITS.short,
    description: 'Channel name when channel is OTHER (e.g. "Indeed"); requires channel OTHER',
  })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.short)
  @RequiresOtherChannel()
  channelDetail?: string | null;

  @ApiPropertyOptional({ enum: Status, default: Status.SENT })
  @IsOptionalNotNull()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.short })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.short)
  contact?: string | null;

  @ApiPropertyOptional({ enum: WorkMode, nullable: true })
  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.short })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.short)
  remoteRhythm?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.short })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.short)
  salaryRange?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.short })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.short)
  cvVersion?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.medium })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.medium)
  stack?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.long })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.long)
  recruitmentProcess?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.long })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.long)
  notes?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.jobPostingText })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.jobPostingText)
  jobPostingText?: string | null;
}

// Fields that can be omitted in an update but never set to null.
const NON_NULLABLE_FIELDS = ['sentAt', 'company', 'jobTitle', 'status'] as const;

/**
 * Partial update: optional fields may be cleared with `null`, the others may not.
 * `PartialType` makes every inherited field `@IsOptional()` (which accepts null), so the
 * non-nullable fields are redeclared here.
 */
export class UpdateApplicationDto extends PartialType(
  OmitType(CreateApplicationDto, NON_NULLABLE_FIELDS),
) {
  @ApiPropertyOptional({ example: '2026-10-01', description: 'YYYY-MM-DD' })
  @IsOptionalNotNull()
  @IsCalendarDate()
  sentAt?: string;

  @ApiPropertyOptional({ maxLength: TEXT_LIMITS.short })
  @Trim()
  @IsOptionalNotNull()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_LIMITS.short)
  company?: string;

  @ApiPropertyOptional({ maxLength: TEXT_LIMITS.short })
  @Trim()
  @IsOptionalNotNull()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_LIMITS.short)
  jobTitle?: string;

  @ApiPropertyOptional({ enum: Status })
  @IsOptionalNotNull()
  @IsEnum(Status)
  status?: Status;
}
