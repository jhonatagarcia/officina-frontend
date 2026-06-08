import { describe, expect, it } from 'vitest';
import { formatPlate, normalizePlate } from '@/lib/utils';

describe('plate utils', () => {
  it('formats vehicle plate with the frontend mask', () => {
    expect(formatPlate('abc1234')).toBe('ABC-1234');
    expect(formatPlate('abc-1d23')).toBe('ABC-1D23');
  });

  it('normalizes masked plate before API persistence', () => {
    expect(normalizePlate('ABC-1234')).toBe('ABC1234');
    expect(normalizePlate('abc-1d23')).toBe('ABC1D23');
  });
});
