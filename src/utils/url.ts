/**
 * View state carried by the address bar. See DESIGN.md § URL and navigation.
 *
 *   ?film=<episode_id>&character=<people id>&log=<episode_id>
 */
export interface ViewState {
  /** Selected film (`episode_id`). */
  filmId: number | null;
  /** Selected character (SWAPI people id). Only meaningful with a film. */
  characterId: number | null;
  /** Film whose viewing log modal is open (`episode_id`). */
  logFilmId: number | null;
}

export const EMPTY_VIEW: ViewState = { filmId: null, characterId: null, logFilmId: null };

function readId(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || !/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

/** Tolerant parser: unknown or malformed parameters are ignored. */
export function parseViewState(search: string): ViewState {
  const params = new URLSearchParams(search);
  const filmId = readId(params, 'film');
  return {
    filmId,
    characterId: filmId === null ? null : readId(params, 'character'),
    logFilmId: readId(params, 'log'),
  };
}

/** Canonical query string (`film`, `character`, `log`), or '' when empty. */
export function toSearch(view: ViewState): string {
  const params = new URLSearchParams();
  if (view.filmId !== null) {
    params.set('film', String(view.filmId));
    if (view.characterId !== null) params.set('character', String(view.characterId));
  }
  if (view.logFilmId !== null) params.set('log', String(view.logFilmId));
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Value for an `<a href>`; '.' resolves to the app root under any base path. */
export function toHref(view: ViewState): string {
  return toSearch(view) || '.';
}

/** `https://swapi.dev/api/people/10/` → 10 */
export function personIdFromUrl(url: string): number | null {
  const match = /\/people\/(\d+)\/?$/.exec(url);
  return match ? Number(match[1]) : null;
}

interface ClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

/**
 * True when a link click should be handled in-app. Modified clicks
 * (new tab, new window, download) are left to the browser.
 */
export function isPlainLeftClick(event: ClickLike): boolean {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
