import { useMemo, useSyncExternalStore } from 'react';
import { parseViewState, toSearch, type ViewState } from '../utils/url';

/** Marks the history entry created by opening the viewing log in this session. */
interface HistoryMarker {
  logPushed?: boolean;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

function getSnapshot(): string {
  return window.location.search;
}

function currentView(): ViewState {
  return parseViewState(window.location.search);
}

function write(view: ViewState, mode: 'push' | 'replace', marker: HistoryMarker | null = null): void {
  const search = toSearch(view);
  if (mode === 'push' && search === window.location.search) return;

  // An empty query needs an explicit path, otherwise the old query stays.
  const url = search || window.location.pathname;
  if (mode === 'push') {
    window.history.pushState(marker, '', url);
  } else {
    window.history.replaceState(marker, '', url);
  }
  listeners.forEach((listener) => listener());
}

function selectFilm(filmId: number): void {
  write({ filmId, characterId: null, logFilmId: null }, 'push');
}

function selectCharacter(characterId: number): void {
  const { filmId } = currentView();
  if (filmId === null) return;
  write({ filmId, characterId, logFilmId: null }, 'push');
}

function openLog(filmId: number): void {
  write({ ...currentView(), logFilmId: filmId }, 'push', { logPushed: true });
}

/**
 * Closes the viewing log. If opening it created a history entry in this
 * session, go back to it so Back/Forward stay consistent; if the page was
 * loaded straight into the modal (shared link), drop `log` in place.
 */
function closeLog(): void {
  const view = currentView();
  if (view.logFilmId === null) return;

  const marker = window.history.state as HistoryMarker | null;
  if (marker?.logPushed) {
    window.history.back();
  } else {
    write({ ...view, logFilmId: null }, 'replace');
  }
}

export interface UrlState {
  view: ViewState;
  selectFilm: (filmId: number) => void;
  selectCharacter: (characterId: number) => void;
  openLog: (filmId: number) => void;
  closeLog: () => void;
}

/**
 * The address bar is the single source of truth for what is on screen.
 * Components read `view` and call the actions; nothing else stores the
 * selection.
 */
export function useUrlState(): UrlState {
  const search = useSyncExternalStore(subscribe, getSnapshot);
  const view = useMemo(() => parseViewState(search), [search]);
  return { view, selectFilm, selectCharacter, openLog, closeLog };
}
