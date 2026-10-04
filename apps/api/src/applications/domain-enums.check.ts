// Compile-time guard: the domain enums must stay identical to the Prisma enums.
// `npm run typecheck` fails here if the schema and the domain drift apart.
import type { ApplicationChannel, ApplicationStatus, WorkMode } from '@openjobseekr/domain';
import type { Channel, Status, WorkMode as PrismaWorkMode } from '../generated/prisma/enums.js';

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const domainEnumsMatchPrisma: [
  Equals<ApplicationStatus, Status>,
  Equals<ApplicationChannel, Channel>,
  Equals<WorkMode, PrismaWorkMode>,
] = [true, true, true];
