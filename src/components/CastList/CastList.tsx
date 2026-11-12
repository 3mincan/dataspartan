import type { MouseEvent } from 'react';
import type { Person } from '../../api/types';
import type { AsyncResult } from '../../hooks/useAsync';
import { isPlainLeftClick, personIdFromUrl, toHref } from '../../utils/url';
import { ErrorMessage } from '../ui/ErrorMessage/ErrorMessage';
import { Spinner } from '../ui/Spinner/Spinner';
import styles from './CastList.module.css';

interface CastListProps {
  filmId: number;
  cast: AsyncResult<Person[]>;
  selectedId: number | null;
  onSelect: (characterId: number) => void;
}

export function CastList({ filmId, cast, selectedId, onSelect }: CastListProps) {
  switch (cast.status) {
    case 'idle':
    case 'loading':
      return (
        <div aria-busy="true">
          <Spinner label="Loading cast" />
        </div>
      );
    case 'error':
      return <ErrorMessage message="The cast could not be loaded." onRetry={cast.retry} />;
    case 'success':
      break;
  }

  // Every SWAPI person URL carries an id; skip any that does not rather than
  // render an entry that cannot be linked to.
  const people = cast.data.flatMap((person) => {
    const id = personIdFromUrl(person.url);
    return id === null ? [] : [{ id, person }];
  });

  if (people.length === 0) {
    return <p className={styles.empty}>No cast listed for this film.</p>;
  }

  return (
    <ul className={styles.list}>
      {people.map(({ id, person }) => {
        const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
          if (!isPlainLeftClick(event)) return;
          event.preventDefault();
          onSelect(id);
        };

        return (
          <li key={person.url}>
            <a
              href={toHref({ filmId, characterId: id, logFilmId: null })}
              aria-current={id === selectedId ? 'true' : undefined}
              className={styles.link}
              onClick={handleClick}
            >
              {person.name}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
