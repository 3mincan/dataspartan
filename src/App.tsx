import { useEffect } from 'react';
import styles from './App.module.css';
import { Announcer } from './components/ui/Announcer/Announcer';
import { useFilms } from './hooks/useFilms';
import { useUrlState } from './hooks/useUrlState';
import { APP_NAME, pageTitle } from './utils/title';

const MAIN_HEADING_ID = 'main-heading';

export function App() {
  const { view } = useUrlState();
  const films = useFilms();

  const filmTitle = (episodeId: number | null): string | null => {
    if (episodeId === null || films.status !== 'success') return null;
    return films.data.find((film) => film.episode_id === episodeId)?.title ?? null;
  };

  const title = pageTitle({
    filmTitle: filmTitle(view.filmId),
    logFilmTitle: filmTitle(view.logFilmId),
  });

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <>
      <a href={`#${MAIN_HEADING_ID}`} className={`visually-hidden ${styles.skipLink}`}>
        Skip to main content
      </a>
      <div className={styles.shell}>
        <nav aria-label="Films" className={styles.nav}>
          <h2 className={styles.navHeading}>Films</h2>
        </nav>
        <main className={styles.main}>
          {/* The skip link targets the heading, not <main>, so focus lands
              on the first meaningful element (accessibility guide § Skip links). */}
          <h1 id={MAIN_HEADING_ID} tabIndex={-1}>
            {APP_NAME}
          </h1>
          <p className={styles.prompt}>Select a film to see its opening crawl and cast.</p>
        </main>
      </div>
      <Announcer message="" />
    </>
  );
}
