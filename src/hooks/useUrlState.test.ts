import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useUrlState } from './useUrlState';

function setUrl(url: string): void {
  window.history.replaceState(null, '', url);
}

beforeEach(() => {
  setUrl('/');
});

describe('useUrlState', () => {
  it('reads the initial view from the address bar', () => {
    setUrl('/?film=4&character=1');
    const { result } = renderHook(() => useUrlState());
    expect(result.current.view).toEqual({ filmId: 4, characterId: 1, logFilmId: null });
  });

  it('selectFilm pushes an entry; re-selecting the same film does not', () => {
    const { result } = renderHook(() => useUrlState());
    const before = window.history.length;

    act(() => result.current.selectFilm(4));
    expect(window.location.search).toBe('?film=4');
    expect(result.current.view.filmId).toBe(4);
    expect(window.history.length).toBe(before + 1);

    act(() => result.current.selectFilm(4));
    expect(window.history.length).toBe(before + 1);
  });

  it('selecting another film drops the character', () => {
    setUrl('/?film=4&character=1');
    const { result } = renderHook(() => useUrlState());

    act(() => result.current.selectFilm(5));
    expect(result.current.view).toEqual({ filmId: 5, characterId: null, logFilmId: null });
  });

  it('selectCharacter pushes within the current film and is ignored without one', () => {
    const { result } = renderHook(() => useUrlState());

    act(() => result.current.selectCharacter(1));
    expect(window.location.search).toBe('');

    act(() => result.current.selectFilm(4));
    act(() => result.current.selectCharacter(1));
    expect(window.location.search).toBe('?film=4&character=1');
  });

  it('closing a log opened in this session goes back in history', async () => {
    setUrl('/?film=4');
    const { result } = renderHook(() => useUrlState());

    act(() => result.current.openLog(4));
    expect(window.location.search).toBe('?film=4&log=4');
    expect(result.current.view.logFilmId).toBe(4);
    const lengthWhileOpen = window.history.length;

    act(() => result.current.closeLog());
    await waitFor(() => expect(result.current.view.logFilmId).toBeNull());
    expect(window.location.search).toBe('?film=4');
    // Went back rather than pushing a new entry.
    expect(window.history.length).toBe(lengthWhileOpen);
  });

  it('closing a deep-linked log replaces the URL without leaving the app', () => {
    setUrl('/?film=4&log=4');
    const { result } = renderHook(() => useUrlState());
    const before = window.history.length;

    act(() => result.current.closeLog());
    expect(window.location.search).toBe('?film=4');
    expect(result.current.view.logFilmId).toBeNull();
    expect(window.history.length).toBe(before);
  });

  it('closeLog is a no-op when no log is open', () => {
    setUrl('/?film=4');
    const { result } = renderHook(() => useUrlState());

    act(() => result.current.closeLog());
    expect(window.location.search).toBe('?film=4');
  });

  it('follows Back and Forward (popstate)', async () => {
    const { result } = renderHook(() => useUrlState());
    act(() => result.current.selectFilm(4));
    act(() => result.current.selectFilm(5));

    act(() => window.history.back());
    await waitFor(() => expect(result.current.view.filmId).toBe(4));

    act(() => window.history.forward());
    await waitFor(() => expect(result.current.view.filmId).toBe(5));
  });
});
