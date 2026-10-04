import { Transform } from 'class-transformer';

export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

/** Trims strings and turns an empty optional text into `null` (cleared field). */
export const TrimToNull = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
