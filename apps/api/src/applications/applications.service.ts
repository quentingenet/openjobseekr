import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../common/app.exception.js';
import { Clock } from '../common/clock.js';
import { ErrorCode } from '../common/error-codes.js';
import type { Env } from '../config/env.schema.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  type FollowUpContext,
  buildListWhere,
  toApplicationCreateData,
  toApplicationData,
  toApplicationDetail,
  toApplicationSummary,
} from './application.mapper.js';
import type { CreateApplicationDto, UpdateApplicationDto } from './dto/application-input.dto.js';
import type { ApplicationDetailDto, ApplicationListDto } from './dto/application-response.dto.js';
import type { ListApplicationsQueryDto } from './dto/list-applications-query.dto.js';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(userId: string, dto: CreateApplicationDto): Promise<ApplicationDetailDto> {
    try {
      const application = await this.prisma.application.create({
        data: toApplicationCreateData(dto, userId),
      });
      return toApplicationDetail(application, this.followUpContext());
    } catch (error) {
      // Foreign key violation: the user of a still-valid token was deleted.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppException(
          ErrorCode.UNAUTHORIZED,
          'User no longer exists',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw error;
    }
  }

  async list(userId: string, query: ListApplicationsQueryDto): Promise<ApplicationListDto> {
    const context = this.followUpContext();
    const where = buildListWhere(userId, query, context);
    const [applications, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        omit: { jobPostingText: true },
        orderBy: [{ sentAt: 'desc' }, { createdAt: 'desc' }],
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
    const application = await this.prisma.application.findFirst({ where: { id, userId } });
    if (!application) throw notFound(id);
    return toApplicationDetail(application, this.followUpContext());
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateApplicationDto,
  ): Promise<ApplicationDetailDto> {
    try {
      const application = await this.prisma.application.update({
        where: { id, userId },
        data: toApplicationData(dto),
      });
      return toApplicationDetail(application, this.followUpContext());
    } catch (error) {
      throw isRecordNotFound(error) ? notFound(id) : error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      await this.prisma.application.delete({ where: { id, userId } });
    } catch (error) {
      throw isRecordNotFound(error) ? notFound(id) : error;
    }
  }

  private followUpContext(): FollowUpContext {
    return {
      today: this.clock.today(),
      delayDays: this.config.get('FOLLOW_UP_DELAY_DAYS', { infer: true }),
    };
  }
}

/** Same answer whether the application does not exist or belongs to another user. */
function notFound(id: string): AppException {
  return new AppException(
    ErrorCode.APPLICATION_NOT_FOUND,
    `Application ${id} not found`,
    HttpStatus.NOT_FOUND,
  );
}

function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}
