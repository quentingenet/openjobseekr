import {
  acceptsChannelDetail,
  channelDetailFor,
  computeFollowUpDate,
  FOLLOW_UP_STATUS,
  isFollowUpOverdue,
  overdueSentBefore,
} from '@openjobseekr/domain';
import type { FollowUpContext } from '../follow-up/follow-up-context.provider.js';
import type { Application, Prisma } from '../generated/prisma/client.js';
import type {
  ApplicationDetailDto,
  ApplicationSummaryDto,
} from './dto/application-response.dto.js';
import type { CreateApplicationDto, UpdateApplicationDto } from './dto/application-input.dto.js';
import type { ListApplicationsQueryDto } from './dto/list-applications-query.dto.js';

/** `@db.Date` columns: `YYYY-MM-DD` <-> UTC midnight, so the date never shifts. */
export function toDbDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The follow-up date set by the user as Prisma data: left out when absent from the input,
 * `null` to go back to the computed date.
 */
function followUpOverrideData(followUpOverride: string | null | undefined): {
  followUpOverride?: Date | null;
} {
  if (followUpOverride === undefined) return {};
  return { followUpOverride: followUpOverride === null ? null : toDbDate(followUpOverride) };
}

export function toApplicationSummary(
  application: Omit<Application, 'jobPostingText'>,
  context: FollowUpContext,
): ApplicationSummaryDto {
  const sentAt = fromDbDate(application.sentAt);
  const followUpOverride = application.followUpOverride
    ? fromDbDate(application.followUpOverride)
    : null;
  const followUpDate = computeFollowUpDate(
    sentAt,
    application.status,
    context.delayDays,
    followUpOverride,
  );
  return {
    id: application.id,
    sentAt,
    company: application.company,
    jobTitle: application.jobTitle,
    location: application.location,
    response: application.response,
    resources: application.resources,
    channel: application.channel,
    channelDetail: application.channelDetail,
    status: application.status,
    contact: application.contact,
    followUpDate,
    followUpOverride,
    followUpOverdue: isFollowUpOverdue(followUpDate, context.today),
    followUpCount: application.followUpCount,
    workMode: application.workMode,
    remoteRhythm: application.remoteRhythm,
    salaryRange: application.salaryRange,
    cvVersion: application.cvVersion,
    stack: application.stack,
    recruitmentProcess: application.recruitmentProcess,
    notes: application.notes,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

export function toApplicationDetail(
  application: Application,
  context: FollowUpContext,
): ApplicationDetailDto {
  return Object.assign(toApplicationSummary(application, context), {
    jobPostingText: application.jobPostingText,
  });
}

/** Prisma data for a new application owned by `userId` (set last: the body cannot override it). */
export function toApplicationCreateData(
  dto: CreateApplicationDto,
  userId: string,
): Prisma.ApplicationUncheckedCreateInput {
  const { sentAt, followUpOverride, ...rest } = dto;
  return {
    ...rest,
    sentAt: toDbDate(sentAt),
    ...followUpOverrideData(followUpOverride),
    channelDetail: channelDetailFor(dto.channel, dto.channelDetail),
    userId,
  };
}

/** Converts validated input to Prisma data. Only the fields present in the input are kept. */
export function toApplicationData(
  dto: UpdateApplicationDto,
): Prisma.ApplicationUncheckedUpdateInput {
  const { sentAt, followUpOverride, ...rest } = dto;
  return {
    ...rest,
    ...(sentAt === undefined ? {} : { sentAt: toDbDate(sentAt) }),
    ...followUpOverrideData(followUpOverride),
    // Leaving the OTHER channel drops its precision.
    ...(dto.channel !== undefined && !acceptsChannelDetail(dto.channel)
      ? { channelDetail: null }
      : {}),
  };
}

/** Filters of the list endpoint. Always scoped to the user. */
export function buildListWhere(
  userId: string,
  query: Pick<ListApplicationsQueryDto, 'status' | 'channel' | 'overdue' | 'q'>,
  context: FollowUpContext,
): Prisma.ApplicationWhereInput {
  const conditions: Prisma.ApplicationWhereInput[] = [{ userId }];
  if (query.status) conditions.push({ status: query.status });
  if (query.channel) conditions.push({ channel: query.channel });
  if (query.overdue === true) {
    // Same rule as `isFollowUpOverdue(computeFollowUpDate(...))`, in the database.
    conditions.push({
      status: FOLLOW_UP_STATUS,
      OR: [
        {
          followUpOverride: null,
          sentAt: { lt: toDbDate(overdueSentBefore(context.today, context.delayDays)) },
        },
        { followUpOverride: { lt: toDbDate(context.today) } },
      ],
    });
  }
  if (query.q) {
    const search = escapeLikePattern(query.q);
    conditions.push({
      OR: [
        { company: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ],
    });
  }
  return { AND: conditions };
}

/** Prisma passes `contains` to LIKE as is: escape its wildcards so they match literally. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}
