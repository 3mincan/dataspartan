import type { ReactNode } from 'react';
import type { Film, Person } from '../../api/types';
import type { AsyncResult } from '../../hooks/useAsync';
import { CastList } from '../CastList/CastList';
import styles from './FilmDetails.module.css';

interface FilmDetailsProps {
  film: Film;
  /** Id of the `<h1>`, the skip link's target. */
  headingId: string;
  cast: AsyncResult<Person[]>;
  selectedCharacterId: number | null;
  onSelectCharacter: (characterId: number) => void;
  /** Rendered next to the cast list (the character panel). */
  characterPanel: ReactNode;
}

export function FilmDetails({
  film,
  headingId,
  cast,
  selectedCharacterId,
  onSelectCharacter,
  characterPanel,
}: FilmDetailsProps) {
  return (
    <>
      <h1 id={headingId} tabIndex={-1} className={styles.title}>
        <span className={styles.number}>{film.episode_id}</span> - {film.title}
      </h1>

      <h2 className={`label ${styles.sectionHeading}`}>Opening crawl</h2>
      {/* Plain text child: React escapes it, and pre-line keeps SWAPI's line breaks. */}
      <p className={styles.crawl}>{film.opening_crawl}</p>

      <div className={styles.castSection}>
        <div className={styles.castLayout}>
          <div>
            <h2 className={`label ${styles.sectionHeading}`}>Cast</h2>
            <CastList
              filmId={film.episode_id}
              cast={cast}
              selectedId={selectedCharacterId}
              onSelect={onSelectCharacter}
            />
          </div>
          <div className={styles.panel}>{characterPanel}</div>
        </div>
      </div>
    </>
  );
}
