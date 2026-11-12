import { expect, it } from 'vitest';
import { APP_NAME, pageTitle } from './title';

it.each([
  [{}, APP_NAME],
  [{ filmTitle: 'A New Hope' }, `A New Hope – ${APP_NAME}`],
  [
    { filmTitle: 'A New Hope', characterName: 'Luke Skywalker' },
    `Luke Skywalker – A New Hope – ${APP_NAME}`,
  ],
  [
    { filmTitle: 'A New Hope', characterName: 'Luke Skywalker', logFilmTitle: 'A New Hope' },
    `Viewing log: A New Hope – ${APP_NAME}`,
  ],
  [{ characterName: 'Luke Skywalker' }, APP_NAME],
])('pageTitle(%j) → %s', (parts, expected) => {
  expect(pageTitle(parts)).toBe(expected);
});
