import { Injectable } from '@nestjs/common';
import { afterFollowUp, FOLLOW_UP_STATUS } from '@openjobseekr/domain';
import { AppException } from '../common/app.exception.js';
import { ErrorCode } from '../common/error-codes.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  buildListWhere,
  toApplicationCreateData,
  toApplicationData,
  toApplicationDetail,
  toApplicationSummary,
  toDbDate,
} from './application.mapper.js';
import type { CreateApplicationDto, UpdateApplicationDto } from './dto/application-input.dto.js';
import type { ApplicationDetailDto, ApplicationListDto } from './dto/application-response.dto.js';
import type { ListApplicationsQueryDto } from './dto/list-applications-query.dto.js';
import { FollowUpContextProvider } from '../follow-up/follow-up-context.provider.js';

/**
 * Every query is scoped by `userId`. A missing record, or one of another user, is reported as
 * not found by the global error handling (Prisma "record not found" on Application ->
 * APPLICATION_NOT_FOUND): reads, updates and deletes all rely on it.
 */
@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly followUp: FollowUpContextProvider,
  ) {}

  async create(userId: string, dto: CreateApplicationDto): Promise<ApplicationDetailDto> {
    const application = await this.prisma.application.create({
      data: toApplicationCreateData(dto, userId),
    });
    return toApplicationDetail(application, this.followUp.context());
  }

  async list(userId: string, query: ListApplicationsQueryDto): Promise<ApplicationListDto> {
    const context = this.followUp.context();
    const where = buildListWhere(userId, query, context);
    const [applications, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        omit: { jobPostingText: true },
        // The id breaks ties: an import creates many rows with the same sent and creation dates,
        // and pages must not overlap.
        orderBy: [{ sentAt: query.order }, { createdAt: query.order }, { id: query.order }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.application.count({ where }),
    ]);
    return {
      items: applications.map((application) => toApplicationSummary(application, context)),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async findOne(userId: string, id: string): Promise<ApplicationDetailDto> {
    const application = await this.prisma.application.findUniqueOrThrow({
      where: { id, userId },
    });
    return toApplicationDetail(application, this.followUp.context());
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateApplicationDto,
  ): Promise<ApplicationDetailDto> {
    const application = await this.prisma.application.update({
      where: { id, userId },
      data: toApplicationData(dto),
    });
    return toApplicationDetail(application, this.followUp.context());
  }

  /**
   * The user followed up today: the follow-up is counted and the next one comes one delay later.
   * Only an application waiting for an answer has a follow-up (FOLLOW_UP_NOT_EXPECTED otherwise).
   */
  async recordFollowUp(userId: string, id: string): Promise<ApplicationDetailDto> {
    const { status, followUpCount } = await this.prisma.application.findUniqueOrThrow({
      where: { id, userId },
      select: { status: true, followUpCount: true },
    });
    if (status !== FOLLOW_UP_STATUS) throw new AppException(ErrorCode.FOLLOW_UP_NOT_EXPECTED);

    const context = this.followUp.context();
    const next = afterFollowUp(followUpCount, context.today, context.delayDays);
    const application = await this.prisma.application.update({
      // The status and count filters guard against a concurrent change (seen as not found).
      where: { id, userId, status: FOLLOW_UP_STATUS, followUpCount },
      data: {
        followUpOverride: toDbDate(next.followUpOverride),
        followUpCount: next.followUpCount,
      },
    });
    return toApplicationDetail(application, context);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.prisma.application.delete({ where: { id, userId } });
  }
}
