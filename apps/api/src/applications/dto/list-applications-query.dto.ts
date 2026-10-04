import { ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@openjobseekr/domain';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/transforms.js';
import { Channel, Status } from '../../generated/prisma/enums.js';

// Far beyond any real list; rejects absurd values with a 400 instead of a database error.
export const MAX_OFFSET = 2_147_483_647;
export const SEARCH_MAX_LENGTH = 100;
export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export class ListApplicationsQueryDto {
  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ enum: Channel })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'true: only applications whose follow-up date is past. false: no filter.',
  })
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsOptional()
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Case-insensitive search on company and job title' })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(SEARCH_MAX_LENGTH)
  q?: string;

  @ApiPropertyOptional({
    enum: SORT_ORDERS,
    default: 'desc',
    description: 'Order by sent date (desc: newest first)',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  order: SortOrder = 'desc';

  @ApiPropertyOptional({ default: DEFAULT_PAGE_SIZE, minimum: 1, maximum: MAX_PAGE_SIZE })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: MAX_OFFSET })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_OFFSET)
  offset: number = 0;
}
