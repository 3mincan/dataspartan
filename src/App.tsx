import { useEffect, useRef, type ReactNode } from 'react';
import styles from './App.module.css';
import { personUrl } from './api/swapi';
import { CharacterCard } from './components/CharacterCard/CharacterCard';
import { FilmDetails } from './components/FilmDetails/FilmDetails';
import { FilmList } from './components/FilmList/FilmList';
import { logButtonId } from './components/FilmList/logButtonId';
import { ViewingLogModal } from './components/ViewingLogModal/ViewingLogModal';
import { Announcer } from './components/ui/Announcer/Announcer';
import { useCast } from './hooks/useCast';
import { useCharacterDetails } from './hooks/useCharacterDetails';
import { useFilms } from './hooks/useFilms';
import { useUrlState } from './hooks/useUrlState';
import { useViewingLog } from './hooks/useViewingLog';
import { APP_NAME, pageTitle } from './utils/title';
import { personIdFromUrl } from './utils/url';

const MAIN_HEADING_ID = 'main-heading';

export function App() {
  const { view, selectFilm, selectCharacter, openLog, closeLog } = useUrlState();
  const films = useFilms();
  const viewingLog = useViewingLog();
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
  // Started from the URL id, so it runs in parallel with the cast request
  // (both share the cached person request).
  const characterDetails = useCharacterDetails(
    selectedFilm && view.characterId !== null ? personUrl(view.characterId) : null,
  );
  const characterNotFound =
    view.characterId !== null && cast.status === 'success' && selectedPerson === undefined;

  const logFilm = findFilm(view.logFilmId);
  const logNotFound =
    view.logFilmId !== null && films.status === 'success' && logFilm === undefined;

  // An unknown `log` value is dropped from the URL (D-027): there is no
  // dialog to show, and leaving it would reopen nothing on every reload.
  useEffect(() => {
    if (logNotFound) closeLog();
  }, [logNotFound, closeLog]);

  const title = pageTitle({
    filmTitle: filmNotFound ? 'Film not found' : selectedFilm?.title,
    characterName: selectedPerson?.name,
    logFilmTitle: logFilm?.title,
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
      characterPanel = <CharacterCard name={selectedPerson.name} details={characterDetails} />;
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
            viewingCount={(filmId) => viewingLog.getViewings(filmId).length}
          />
        </nav>
        <main ref={mainRef} className={styles.main}>
          {mainContent}
        </main>
      </div>
      <ViewingLogModal
        film={logFilm}
        getViewings={viewingLog.getViewings}
        onAdd={viewingLog.addViewing}
        onRemove={viewingLog.removeViewing}
        onClose={closeLog}
        logButtonId={logButtonId}
      />
      <Announcer message={announcement} />
    </>
  );
}
