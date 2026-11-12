import { describe, expect, it } from 'vitest';
import { formatValue, isDroid } from './character';

describe('isDroid', () => {
  it.each([
    [[{ name: 'Droid' }], true],
    [[{ name: ' droid ' }], true],
    [[{ name: 'Human' }, { name: 'Droid' }], true],
    [[{ name: 'Human' }], false],
    [[], false],
  ])('%j → %s', (species, expected) => {
    expect(isDroid(species)).toBe(expected);
  });
});

describe('formatValue', () => {
  it.each<[string | undefined, string | undefined, string]>([
    ['172', 'cm', '172 cm'],
    ['19BBY', undefined, '19BBY'],
    ['unknown', 'kg', 'Unknown'],
    ['n/a', undefined, 'Unknown'],
    ['none', undefined, 'Unknown'],
    ['', undefined, '—'],
    [undefined, 'cm', '—'],
  ])('formatValue(%j, %j) → %j', (value, unit, expected) => {
    expect(formatValue(value, unit)).toBe(expected);
  });
});
