import { getFilms } from '../api/swapi';
import type { Film } from '../api/types';
import { useAsync, type AsyncResult } from './useAsync';

/** Fetches all films once, at application startup. */
export function useFilms(): AsyncResult<Film[]> {
  return useAsync('films', getFilms);
}
