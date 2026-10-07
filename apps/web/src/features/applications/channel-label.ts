import { acceptsChannelDetail } from '@openjobseekr/domain';
import type { TFunction } from 'i18next';
import type { ApplicationChannel } from '../../api/types';

/** "LinkedIn", or "Other (Monster)" when the OTHER channel has a precision. */
export function channelLabel(
  t: TFunction,
  channel: ApplicationChannel | null,
  channelDetail: string | null,
): string | null {
  if (!channel) return null;
  if (acceptsChannelDetail(channel) && channelDetail)
    return t('form.channelOther', { detail: channelDetail });
  return t(`channel.${channel}`);
}
