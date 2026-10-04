import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { acceptsChannelDetail, type ApplicationChannel, TEXT_LIMITS } from '@openjobseekr/domain';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateBy } from 'class-validator';
import {
  IsCalendarDate,
  IsOptionalNotNull,
} from '../../common/decorators/validation.decorators.js';
import { Trim, TrimToNull } from '../../common/transforms.js';
import { Channel, Status, WorkMode } from '../../generated/prisma/enums.js';

/** A precision is only allowed with the OTHER channel, sent in the same request. */
const RequiresOtherChannel = (): PropertyDecorator =>
  ValidateBy({
    name: 'requiresOtherChannel',
    validator: {
      validate: (value: unknown, args) =>
        value === null ||
        value === undefined ||
        acceptsChannelDetail((args?.object as { channel?: ApplicationChannel | null }).channel),
      defaultMessage: () => '$property is only allowed when channel is OTHER',
    },
  });

/** Fields in the spreadsheet column order. `null` clears an optional field. */
export class CreateApplicationDto {
  @ApiProperty({ example: '2026-10-01', description: 'YYYY-MM-DD' })
  @IsCalendarDate()
  sentAt: string;

  @ApiProperty({ maxLength: TEXT_LIMITS.company })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_LIMITS.company)
  company: string;

  @ApiProperty({ maxLength: TEXT_LIMITS.jobTitle })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_LIMITS.jobTitle)
  jobTitle: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.location })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.location)
  location?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.response })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.response)
  response?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.resources })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.resources)
  resources?: string | null;

  @ApiPropertyOptional({ enum: Channel, nullable: true })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: TEXT_LIMITS.channelDetail,
    description: 'Channel name when channel is OTHER (e.g. "Indeed"); requires channel OTHER',
  })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.channelDetail)
  @RequiresOtherChannel()
  channelDetail?: string | null;

  @ApiPropertyOptional({ enum: Status, default: Status.SENT })
  @IsOptionalNotNull()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.contact })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.contact)
  contact?: string | null;

  @ApiPropertyOptional({ enum: WorkMode, nullable: true })
  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.remoteRhythm })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.remoteRhythm)
  remoteRhythm?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.salaryRange })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.salaryRange)
  salaryRange?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.cvVersion })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.cvVersion)
  cvVersion?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.stack })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.stack)
  stack?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.recruitmentProcess })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.recruitmentProcess)
  recruitmentProcess?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: TEXT_LIMITS.notes })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_LIMITS.notes)
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

  @ApiPropertyOptional({ maxLength: TEXT_LIMITS.company })
  @Trim()
  @IsOptionalNotNull()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_LIMITS.company)
  company?: string;

  @ApiPropertyOptional({ maxLength: TEXT_LIMITS.jobTitle })
  @Trim()
  @IsOptionalNotNull()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_LIMITS.jobTitle)
  jobTitle?: string;

  @ApiPropertyOptional({ enum: Status })
  @IsOptionalNotNull()
  @IsEnum(Status)
  status?: Status;
}
