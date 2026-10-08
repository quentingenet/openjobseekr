import { describe, expect, it } from 'vitest';
import { columnLetter, formatChannelCell, parseChannelCell } from './spreadsheet-format.js';

describe('columnLetter', () => {
  it('names columns like a spreadsheet', () => {
    expect([0, 17, 25, 26, 27, 701, 702].map(columnLetter)).toEqual([
      'A',
      'R',
      'Z',
      'AA',
      'AB',
      'ZZ',
      'AAA',
    ]);
  });
});

describe('CANAL cell', () => {
  it('writes the channel label, with the precision of the OTHER channel', () => {
    expect(formatChannelCell('APEC', null)).toBe('Apec');
    expect(formatChannelCell('OTHER', 'Monster')).toBe('Autre (Monster)');
    expect(formatChannelCell('OTHER', null)).toBe('Autre');
    expect(formatChannelCell(null, null)).toBeNull();
  });

  it('reads back what it writes', () => {
    expect(parseChannelCell('Autre (Monster)')).toEqual({
      channel: 'OTHER',
      channelDetail: 'Monster',
    });
    expect(parseChannelCell('Autre (Jobs (tech))')).toEqual({
      channel: 'OTHER',
      channelDetail: 'Jobs (tech)',
    });
    expect(parseChannelCell('apec')).toEqual({ channel: 'APEC', channelDetail: null });
  });

  it('rejects an unknown label, or a precision on another channel', () => {
    expect(parseChannelCell('Monster')).toBeNull();
    expect(parseChannelCell('Apec (Paris)')).toBeNull();
    expect(parseChannelCell('Autre ()')).toBeNull();
  });
});
