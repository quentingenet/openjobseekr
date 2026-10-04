import type { TFunction } from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import i18n from '../i18n';
import { applyServerErrors, constraintMessage } from './server-errors';

describe('constraintMessage', () => {
  it.each([
    [['isNotEmpty', 'isString'], 'validation.required'],
    [['maxLength'], 'validation.tooLong'],
    [['isCalendarDate'], 'validation.date'],
    [['isRegex'], 'validation.regex'],
    [['isEnum'], 'validation.invalid'],
  ])('maps %j to %s', (constraints, key) => {
    expect(constraintMessage(constraints)).toBe(key);
  });

  it('accepts extra mappings for a form', () => {
    expect(constraintMessage(['max'], [['max', 'validation.level']])).toBe('validation.level');
  });
});

describe('applyServerErrors', () => {
  const t: TFunction = i18n.getFixedT('en');

  it('puts known invalid fields under their input and the error in the banner', () => {
    const setError = vi.fn();
    const error = new ApiError(400, 'VALIDATION_FAILED', 'Validation failed', [
      { field: 'company', constraints: ['isNotEmpty'] },
      { field: 'unknownField', constraints: ['isString'] },
    ]);

    applyServerErrors(error, setError, ['company', 'jobTitle'], t);

    expect(setError.mock.calls).toEqual([
      ['company', { type: 'server', message: 'validation.required' }],
      ['root.server', { type: 'server', message: 'Some fields are invalid.' }],
    ]);
  });

  it('only sets the banner for errors without fields, e.g. a network failure', () => {
    const setError = vi.fn();

    applyServerErrors(new TypeError('boom'), setError, ['company'], t);

    expect(setError.mock.calls).toEqual([
      ['root.server', { type: 'server', message: 'An unexpected error occurred.' }],
    ]);
  });
});
