import { useEffect, type ReactNode } from 'react';
import styles from './App.module.css';
import { FilmList } from './components/FilmList/FilmList';
import { Announcer } from './components/ui/Announcer/Announcer';
import { useFilms } from './hooks/useFilms';
import { useUrlState } from './hooks/useUrlState';
import { APP_NAME, pageTitle } from './utils/title';

const MAIN_HEADING_ID = 'main-heading';

export function App() {
  const { view, selectFilm, openLog } = useUrlState();
  const films = useFilms();

  const findFilm = (episodeId: number | null) =>
    episodeId === null || films.status !== 'success'
      ? undefined
      : films.data.find((film) => film.episode_id === episodeId);

  const selectedFilm = findFilm(view.filmId);
  const filmNotFound =
    view.filmId !== null && films.status === 'success' && selectedFilm === undefined;

  const title = pageTitle({
    filmTitle: filmNotFound ? 'Film not found' : selectedFilm?.title,
    logFilmTitle: findFilm(view.logFilmId)?.title,
  });

  useEffect(() => {
    document.title = title;
  }, [title]);

  // Derived from the URL, so Back/Forward are announced the same way as clicks.
  const announcement = selectedFilm ? `Showing ${selectedFilm.title}` : '';

  let mainHeading = APP_NAME;
  let mainBody: ReactNode = (
    <p className={styles.prompt}>Select a film to see its opening crawl and cast.</p>
  );
  if (selectedFilm) {
    mainHeading = `${selectedFilm.episode_id} - ${selectedFilm.title}`;
    mainBody = null;
  } else if (filmNotFound) {
    mainHeading = 'Film not found';
    mainBody = (
      <p>
        There is no film with episode number {view.filmId}.{' '}
        {/* A full page load is acceptable for this rare path. */}
        <a href=".">Show all films</a>
      </p>
    );
  }

  return (
    <>
      <a href={`#${MAIN_HEADING_ID}`} className={`visually-hidden ${styles.skipLink}`}>
        Skip to main content
      </a>
      <div className={styles.shell}>
        <nav aria-label="Films" className={styles.nav}>
          <h2 className={styles.navHeading}>Films</h2>
          <FilmList
            films={films}
            selectedFilmId={view.filmId}
            onSelect={selectFilm}
            onOpenLog={openLog}
          />
        </nav>
        <main className={styles.main}>
          {/* The skip link targets the heading, not <main>, so focus lands
              on the first meaningful element (accessibility guide § Skip links). */}
          <h1 id={MAIN_HEADING_ID} tabIndex={-1}>
            {mainHeading}
          </h1>
          {mainBody}
        </main>
      </div>
      <Announcer message={announcement} />
    </>
  );
}
