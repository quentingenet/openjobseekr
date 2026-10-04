import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Channel, Status, WorkMode } from '../../generated/prisma/enums.js';

export class ApplicationDetailDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-10-01' })
  sentAt: string;

  @ApiProperty()
  company: string;

  @ApiProperty()
  jobTitle: string;

  @ApiProperty({ type: String, nullable: true })
  location: string | null;

  @ApiProperty({ type: String, nullable: true })
  response: string | null;

  @ApiProperty({ type: String, nullable: true })
  resources: string | null;

  @ApiProperty({ enum: Channel, nullable: true })
  channel: Channel | null;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty({ type: String, nullable: true })
  contact: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-10-08',
    description: 'Computed: sentAt + follow-up delay while the status is SENT',
  })
  followUpDate: string | null;

  @ApiProperty({ description: 'Computed: true when today is after followUpDate' })
  followUpOverdue: boolean;

  @ApiProperty({ enum: WorkMode, nullable: true })
  workMode: WorkMode | null;

  @ApiProperty({ type: String, nullable: true })
  remoteRhythm: string | null;

  @ApiProperty({ type: String, nullable: true })
  salaryRange: string | null;

  @ApiProperty({ type: String, nullable: true })
  cvVersion: string | null;

  @ApiProperty({ type: String, nullable: true })
  stack: string | null;

  @ApiProperty({ type: String, nullable: true })
  recruitmentProcess: string | null;

  @ApiProperty({ type: String, nullable: true })
  notes: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Only in the detail response' })
  jobPostingText: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

/** List item: everything except the (long) job posting text. */
export class ApplicationSummaryDto extends OmitType(ApplicationDetailDto, ['jobPostingText']) {}

export class ApplicationListDto {
  @ApiProperty({ type: [ApplicationSummaryDto] })
  items: ApplicationSummaryDto[];

  @ApiProperty({ description: 'Number of applications matching the filters' })
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}
