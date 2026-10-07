import { describe, expect, it } from 'vitest';
import { acceptsChannelDetail, channelDetailFor, OTHER_CHANNEL } from './channel.js';

describe('acceptsChannelDetail', () => {
  it('accepts a precision only for the OTHER channel', () => {
    expect(OTHER_CHANNEL).toBe('OTHER');
    expect(acceptsChannelDetail('OTHER')).toBe(true);
    expect(acceptsChannelDetail('LINKEDIN')).toBe(false);
    expect(acceptsChannelDetail(null)).toBe(false);
    expect(acceptsChannelDetail(undefined)).toBe(false);
  });
});

describe('channelDetailFor', () => {
  it('keeps the precision of the OTHER channel', () => {
    expect(channelDetailFor('OTHER', 'Monster')).toBe('Monster');
  });

  it('drops the precision of any other channel, or without a channel', () => {
    expect(channelDetailFor('APEC', 'Monster')).toBeNull();
    expect(channelDetailFor(null, 'Monster')).toBeNull();
  });

  it('turns an empty or missing precision into null', () => {
    expect(channelDetailFor('OTHER', '')).toBeNull();
    expect(channelDetailFor('OTHER', undefined)).toBeNull();
    expect(channelDetailFor('OTHER', null)).toBeNull();
  });
});
