// Compile-time guard: the domain enums must stay identical to the Prisma enums.
// `npm run typecheck` fails here if the schema and the domain drift apart.
import type { Channel, Status } from '../generated/prisma/enums.js';
import type { ApplicationChannel } from './domain/channel.js';
import type { ApplicationStatus } from './domain/status.js';

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const domainEnumsMatchPrisma: [
  Equals<ApplicationStatus, Status>,
  Equals<ApplicationChannel, Channel>,
] = [true, true];
