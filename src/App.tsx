import { useEffect, useRef, type ReactNode } from 'react';
import styles from './App.module.css';
import { FilmDetails } from './components/FilmDetails/FilmDetails';
import { FilmList } from './components/FilmList/FilmList';
import { Announcer } from './components/ui/Announcer/Announcer';
import { useCast } from './hooks/useCast';
import { useFilms } from './hooks/useFilms';
import { useUrlState } from './hooks/useUrlState';
import { APP_NAME, pageTitle } from './utils/title';
import { personIdFromUrl } from './utils/url';

const MAIN_HEADING_ID = 'main-heading';

export function App() {
  const { view, selectFilm, selectCharacter, openLog } = useUrlState();
  const films = useFilms();
  const mainRef = useRef<HTMLElement>(null);

  const findFilm = (episodeId: number | null) =>
    episodeId === null || films.status !== 'success'
      ? undefined
      : films.data.find((film) => film.episode_id === episodeId);

  const selectedFilm = findFilm(view.filmId);
  const filmNotFound =
    view.filmId !== null && films.status === 'success' && selectedFilm === undefined;

  const cast = useCast(selectedFilm ?? null);
  const selectedPerson =
    view.characterId !== null && cast.status === 'success'
      ? cast.data.find((person) => personIdFromUrl(person.url) === view.characterId)
      : undefined;
  const characterNotFound =
    view.characterId !== null && cast.status === 'success' && selectedPerson === undefined;

  const title = pageTitle({
    filmTitle: filmNotFound ? 'Film not found' : selectedFilm?.title,
    characterName: selectedPerson?.name,
    logFilmTitle: findFilm(view.logFilmId)?.title,
  });

  useEffect(() => {
    document.title = title;
  }, [title]);

  // A new film starts at the top of the main zone (where it is the scroller).
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [view.filmId]);

  // Derived from the URL, so Back/Forward are announced the same way as clicks.
  let announcement = '';
  if (selectedPerson) announcement = `Showing details for ${selectedPerson.name}`;
  else if (selectedFilm) announcement = `Showing ${selectedFilm.title}`;

  let mainContent: ReactNode;
  if (selectedFilm) {
    let characterPanel: ReactNode = (
      <p className={styles.muted}>Select a character to see their details.</p>
    );
    if (selectedPerson) {
      characterPanel = <h2>{selectedPerson.name}</h2>;
    } else if (characterNotFound) {
      characterPanel = <p>Character not found in this film.</p>;
    }

    mainContent = (
      <FilmDetails
        film={selectedFilm}
        headingId={MAIN_HEADING_ID}
        cast={cast}
        selectedCharacterId={view.characterId}
        onSelectCharacter={selectCharacter}
        characterPanel={characterPanel}
      />
    );
  } else {
    mainContent = (
      <>
        {/* The skip link targets the heading, not <main>, so focus lands
            on the first meaningful element (accessibility guide § Skip links). */}
        <h1 id={MAIN_HEADING_ID} tabIndex={-1}>
          {filmNotFound ? 'Film not found' : APP_NAME}
        </h1>
        {filmNotFound ? (
          <p>
            There is no film with episode number {view.filmId}.{' '}
            {/* A full page load is acceptable for this rare path. */}
            <a href=".">Show all films</a>
          </p>
        ) : (
          <p className={styles.muted}>Select a film to see its opening crawl and cast.</p>
        )}
      </>
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
        <main ref={mainRef} className={styles.main}>
          {mainContent}
        </main>
      </div>
      <Announcer message={announcement} />
    </>
  );
}
