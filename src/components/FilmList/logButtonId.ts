/** Id of a film's log button; the modal focuses it when it had no opener. */
export function logButtonId(filmId: number): string {
  return `log-button-${filmId}`;
}
