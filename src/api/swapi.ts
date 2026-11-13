import type { Film, Paginated, Person, Planet, Species } from './types';

const BASE_URL = 'https://swapi.dev/api';

export class SwapiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SwapiError';
    this.status = status;
  }
}

/**
 * Promise cache keyed by URL.
 * Storing the promise (not the resolved value) de-duplicates concurrent
 * requests for the same resource. Failed requests are evicted so a retry
 * actually hits the network again.
 */
const cache = new Map<string, Promise<unknown>>();

function normalizeUrl(url: string): string {
  return url.replace(/^http:\/\//, 'https://');
}

async function request<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new SwapiError('Network error while contacting SWAPI.');
  }
  if (!response.ok) {
    throw new SwapiError(`SWAPI responded with ${response.status}.`, response.status);
  }
  return (await response.json()) as T;
}

export function fetchJson<T>(url: string): Promise<T> {
  const key = normalizeUrl(url);
  const cached = cache.get(key);
  if (cached) return cached as Promise<T>;

  const promise = request<T>(key).catch((error: unknown) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, promise);
  return promise;
}

/** Follows `next` links until the collection is exhausted. */
async function fetchAll<T>(url: string): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = url;
  while (next) {
    const page: Paginated<T> = await fetchJson<Paginated<T>>(next);
    items.push(...page.results);
    next = page.next;
  }
  return items;
}

/** All films, sorted by episode number. */
export async function getFilms(): Promise<Film[]> {
  const films = await fetchAll<Film>(`${BASE_URL}/films/`);
  return [...films].sort((a, b) => a.episode_id - b.episode_id);
}

/** Canonical resource URL for a people id taken from the address bar. */
export function personUrl(id: number): string {
  return `${BASE_URL}/people/${id}/`;
}

export function getPerson(url: string): Promise<Person> {
  return fetchJson<Person>(url);
}

export function getSpecies(url: string): Promise<Species> {
  return fetchJson<Species>(url);
}

export function getPlanet(url: string): Promise<Planet> {
  return fetchJson<Planet>(url);
}
