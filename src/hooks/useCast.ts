import { getPerson } from '../api/swapi';
import type { Film, Person } from '../api/types';
import { useAsync, type AsyncResult } from './useAsync';

/** Loads every character of the given film in parallel. */
export function useCast(film: Film | null): AsyncResult<Person[]> {
  return useAsync(film ? film.url : null, () =>
    Promise.all((film?.characters ?? []).map(getPerson)),
  );
}
