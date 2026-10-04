// Compile-time guard: the domain enums must stay identical to the enums of the API contract
// (OpenAPI). `npm run typecheck` fails here if a value is added on one side only, instead of
// silently missing from the selects and statistics.
import type {
  ApplicationChannel as DomainChannel,
  ApplicationStatus as DomainStatus,
  WorkMode as DomainWorkMode,
} from '@openjobseekr/domain';
import type { ApplicationChannel, ApplicationStatus, WorkMode } from './types';

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const domainEnumsMatchOpenApi: [
  Equals<DomainStatus, ApplicationStatus>,
  Equals<DomainChannel, ApplicationChannel>,
  Equals<DomainWorkMode, WorkMode>,
] = [true, true, true];
