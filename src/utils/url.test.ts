import { describe, expect, it } from 'vitest';
import {
  isPlainLeftClick,
  parseViewState,
  personIdFromUrl,
  toHref,
  toSearch,
  type ViewState,
} from './url';

const EMPTY_VIEW: ViewState = { filmId: null, characterId: null, logFilmId: null };

describe('parseViewState / toSearch', () => {
  it.each<[string, ViewState]>([
    ['', EMPTY_VIEW],
    ['?film=4', { filmId: 4, characterId: null, logFilmId: null }],
    ['?film=4&character=1', { filmId: 4, characterId: 1, logFilmId: null }],
    ['?film=4&log=4', { filmId: 4, characterId: null, logFilmId: 4 }],
    ['?log=2', { filmId: null, characterId: null, logFilmId: 2 }],
    ['?film=4&character=1&log=6', { filmId: 4, characterId: 1, logFilmId: 6 }],
  ])('round-trips %j', (search, view) => {
    expect(parseViewState(search)).toEqual(view);
    expect(toSearch(view)).toBe(search);
  });

  it.each(['0', '-1', '1.5', 'abc', '01', '', ' 4', '1e3', '99999999999999999999'])(
    'ignores malformed id %j',
    (raw) => {
      expect(parseViewState(`?film=${raw}`).filmId).toBeNull();
    },
  );

  it('ignores character without film', () => {
    expect(parseViewState('?character=1')).toEqual(EMPTY_VIEW);
  });

  it('ignores unknown parameters and serialises in canonical order', () => {
    const view = parseViewState('?log=3&utm=x&character=2&film=5');
    expect(toSearch(view)).toBe('?film=5&character=2&log=3');
  });

  it('drops character when serialising a view without film', () => {
    expect(toSearch({ filmId: null, characterId: 7, logFilmId: null })).toBe('');
  });
});

describe('toHref', () => {
  it('returns the query, or "." for the empty view', () => {
    expect(toHref({ filmId: 1, characterId: null, logFilmId: null })).toBe('?film=1');
    expect(toHref(EMPTY_VIEW)).toBe('.');
  });
});

describe('personIdFromUrl', () => {
  it.each<[string, number | null]>([
    ['https://swapi.dev/api/people/10/', 10],
    ['https://swapi.dev/api/people/10', 10],
    ['https://swapi.dev/api/planets/10/', null],
    ['not a url', null],
  ])('%s → %s', (url, id) => {
    expect(personIdFromUrl(url)).toBe(id);
  });
});

describe('isPlainLeftClick', () => {
  const plain = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
  };

  it('accepts an unmodified primary click', () => {
    expect(isPlainLeftClick(plain)).toBe(true);
  });

  it.each([
    ['middle button', { button: 1 }],
    ['meta (Cmd)', { metaKey: true }],
    ['ctrl', { ctrlKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
    ['already prevented', { defaultPrevented: true }],
  ])('rejects %s', (_, override) => {
    expect(isPlainLeftClick({ ...plain, ...override })).toBe(false);
  });
});
