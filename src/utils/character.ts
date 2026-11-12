import type { Species } from '../api/types';

/**
 * swapi.dev returns an empty `species` array for humans.
 * See DECISIONS.md (D-005).
 */
export const HUMAN_FALLBACK: Pick<Species, 'name' | 'classification'> = {
  name: 'Human',
  classification: 'mammal',
};

export function isDroid(species: Pick<Species, 'name'>[]): boolean {
  return species.some((s) => s.name.trim().toLowerCase() === 'droid');
}

/** Renders SWAPI's "unknown" / "n/a" placeholders consistently. */
export function formatValue(value: string | undefined, unit?: string): string {
  if (!value) return '—';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'unknown' || normalized === 'n/a' || normalized === 'none') {
    return 'Unknown';
  }
  return unit ? `${value} ${unit}` : value;
}
