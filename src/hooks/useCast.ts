import { getPerson } from '../api/swapi';
import type { Film, Person } from '../api/types';
import { useAsync, type AsyncResult } from './useAsync';

/**
 * Loads every character of the given film in parallel. All-or-nothing
 * (D-030): a retry only re-requests the failures, since `fetchJson` keeps
 * successful responses cached.
 */
export function useCast(film: Film | null): AsyncResult<Person[]> {
  return useAsync(film ? film.url : null, () =>
    Promise.all((film?.characters ?? []).map(getPerson)),
  );
}
