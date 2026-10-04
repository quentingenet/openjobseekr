/**
 * Application channels, mirrored from the Prisma `Channel` enum (see `domain-enums.check.ts` in
 * the API and the web app).
 */
export const APPLICATION_CHANNELS = [
  'CAREER_SITE',
  'LINKEDIN',
  'WELCOME_TO_THE_JUNGLE',
  'HELLOWORK',
  'APEC',
  'RECRUITMENT_AGENCY',
  'UNSOLICITED',
  'REFERRAL',
  'OTHER',
] as const;

export type ApplicationChannel = (typeof APPLICATION_CHANNELS)[number];

/** The channel whose name the user types as a precision (`channelDetail`, e.g. "Indeed"). */
export const OTHER_CHANNEL = 'OTHER' satisfies ApplicationChannel;

/** Only the OTHER channel takes a precision. */
export function acceptsChannelDetail(channel: ApplicationChannel | null | undefined): boolean {
  return channel === OTHER_CHANNEL;
}

/** The precision to store for a channel: dropped for any other channel, `null` when empty. */
export function channelDetailFor(
  channel: ApplicationChannel | null | undefined,
  channelDetail: string | null | undefined,
): string | null {
  return acceptsChannelDetail(channel) && channelDetail ? channelDetail : null;
}
