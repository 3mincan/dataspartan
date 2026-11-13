import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { clearCache, fetchJson, getFilms, personUrl, SwapiError } from './swapi';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  clearCache();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

it('de-duplicates concurrent requests and caches the result', async () => {
  fetchMock.mockResolvedValue(jsonResponse({ name: 'Luke' }));

  const [a, b] = await Promise.all([
    fetchJson('https://swapi.dev/api/people/1/'),
    fetchJson('https://swapi.dev/api/people/1/'),
  ]);
  const c = await fetchJson('https://swapi.dev/api/people/1/');

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(a).toEqual({ name: 'Luke' });
  expect(b).toBe(a);
  expect(c).toBe(a);
});

it('treats http and https URLs from SWAPI as the same resource', async () => {
  fetchMock.mockResolvedValue(jsonResponse({ name: 'Luke' }));

  await fetchJson('http://swapi.dev/api/people/1/');
  await fetchJson('https://swapi.dev/api/people/1/');

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith('https://swapi.dev/api/people/1/');
});

it('rejects with the status on a non-OK response and evicts it, so a retry refetches', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({}, 404));
  const error = await fetchJson('https://swapi.dev/api/people/999/').catch((e: unknown) => e);
  expect(error).toBeInstanceOf(SwapiError);
  expect(error).toMatchObject({ status: 404 });

  fetchMock.mockResolvedValueOnce(jsonResponse({ name: 'Found' }));
  await expect(fetchJson('https://swapi.dev/api/people/999/')).resolves.toEqual({ name: 'Found' });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('wraps network failures in a SwapiError without a status', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  const error = await fetchJson('https://swapi.dev/api/films/').catch((e: unknown) => e);
  expect(error).toBeInstanceOf(SwapiError);
  expect(error).toMatchObject({ status: undefined });
});

it('getFilms follows pagination and sorts by episode', async () => {
  fetchMock.mockImplementation((input) => {
    const url = String(input);
    if (url === 'https://swapi.dev/api/films/') {
      return Promise.resolve(
        jsonResponse({
          count: 3,
          next: 'http://swapi.dev/api/films/?page=2',
          previous: null,
          results: [{ episode_id: 5 }, { episode_id: 1 }],
        }),
      );
    }
    return Promise.resolve(
      jsonResponse({ count: 3, next: null, previous: null, results: [{ episode_id: 3 }] }),
    );
  });

  const films = await getFilms();

  expect(films.map((film) => film.episode_id)).toEqual([1, 3, 5]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('personUrl builds the canonical resource URL', () => {
  expect(personUrl(12)).toBe('https://swapi.dev/api/people/12/');
});
