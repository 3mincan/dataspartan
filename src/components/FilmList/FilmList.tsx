import type { MouseEvent } from 'react';
import type { Film } from '../../api/types';
import type { AsyncResult } from '../../hooks/useAsync';
import { isPlainLeftClick, toHref } from '../../utils/url';
import { ErrorMessage } from '../ui/ErrorMessage/ErrorMessage';
import { Spinner } from '../ui/Spinner/Spinner';
import styles from './FilmList.module.css';
import { logButtonId } from './logButtonId';

interface FilmListProps {
  films: AsyncResult<Film[]>;
  selectedFilmId: number | null;
  onSelect: (filmId: number) => void;
  onOpenLog: (filmId: number) => void;
  viewingCount: (filmId: number) => number;
}

export function FilmList({
  films,
  selectedFilmId,
  onSelect,
  onOpenLog,
  viewingCount,
}: FilmListProps) {
  switch (films.status) {
    case 'idle':
    case 'loading':
      return (
        <div aria-busy="true">
          <Spinner label="Loading films" />
        </div>
      );
    case 'error':
      return <ErrorMessage message="Films could not be loaded." onRetry={films.retry} />;
    case 'success':
      break;
  }

  if (films.data.length === 0) {
    return <p className={styles.empty}>No films found.</p>;
  }

  return (
    <ul className={styles.list}>
      {films.data.map((film) => {
        const id = film.episode_id;
        const selected = id === selectedFilmId;
        const count = viewingCount(id);

        // A real link, so open-in-new-tab and copy-link work (D-024); a plain
        // click is handled in-app without a reload.
        const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
          if (!isPlainLeftClick(event)) return;
          event.preventDefault();
          onSelect(id);
        };

        return (
          <li key={film.url} className={styles.item}>
            <a
              href={toHref({ filmId: id, characterId: null, logFilmId: null })}
              aria-current={selected ? 'page' : undefined}
              className={styles.link}
              onClick={handleClick}
            >
              {/* Same text as "{id} - {title}"; the span only styles the number. */}
              <span className={styles.number}>{id}</span> - {film.title}
            </a>
            <button
              id={logButtonId(id)}
              type="button"
              aria-haspopup="dialog"
              className={styles.logButton}
              onClick={() => onOpenLog(id)}
            >
              {/* The name keeps the visible word "log" (WCAG 2.5.3) and says
                  which film it belongs to. */}
              <span aria-hidden="true" className={styles.logText}>
                Log
              </span>
              <span className="visually-hidden">Viewing log for {film.title}</span>
              {count > 0 && (
                <>
                  <span aria-hidden="true" className={styles.count}>
                    {count}
                  </span>
                  <span className="visually-hidden">
                    , {count} {count === 1 ? 'viewing' : 'viewings'}
                  </span>
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
