export const APP_NAME = 'Star Wars Films';

interface TitleParts {
  filmTitle?: string | null;
  characterName?: string | null;
  logFilmTitle?: string | null;
}

/**
 * `document.title` for the current view, most specific part first
 * (WCAG 2.4.2). The open viewing log wins because it covers the page.
 */
export function pageTitle({ filmTitle, characterName, logFilmTitle }: TitleParts): string {
  if (logFilmTitle) return `Viewing log: ${logFilmTitle} – ${APP_NAME}`;
  if (filmTitle && characterName) return `${characterName} – ${filmTitle} – ${APP_NAME}`;
  if (filmTitle) return `${filmTitle} – ${APP_NAME}`;
  return APP_NAME;
}
