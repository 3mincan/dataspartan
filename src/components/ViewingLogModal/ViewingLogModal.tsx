import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import type { Film, NewViewing, Viewing } from '../../api/types';
import { Modal } from '../ui/Modal/Modal';
import styles from './ViewingLogModal.module.css';

interface ViewingLogModalProps {
  /** The film whose log the URL asks for, or undefined when the log is closed. */
  film: Film | undefined;
  getViewings: (filmId: number) => Viewing[];
  onAdd: (filmId: number, viewing: NewViewing) => void;
  onRemove: (filmId: number, viewingId: string) => void;
  onClose: () => void;
  /** Id of the film's log button, focused if the dialog had no opener. */
  logButtonId: (filmId: number) => string;
}

const TITLE_ID = 'viewing-log-title';
const ERROR_ANNOUNCE_DELAY_MS = 500;

const REQUIRED_FIELDS = {
  date: { label: 'Date', errorId: 'viewing-date-error', message: 'Date is required.' },
  time: { label: 'Time', errorId: 'viewing-time-error', message: 'Time is required.' },
} as const;
type RequiredField = keyof typeof REQUIRED_FIELDS;

const whenFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

function formatWhen(viewing: Pick<Viewing, 'date' | 'time'>): string {
  return whenFormat.format(new Date(`${viewing.date}T${viewing.time}`));
}

export function ViewingLogModal({
  film,
  getViewings,
  onAdd,
  onRemove,
  onClose,
  logButtonId,
}: ViewingLogModalProps) {
  // Keep showing the last film while the dialog closes: focus must still be
  // inside it when it closes, or the browser will not return focus to the
  // opener. (Adjusting state during render: react.dev, "You might not need
  // an effect".)
  const [shownFilm, setShownFilm] = useState(film);
  if (film && film !== shownFilm) setShownFilm(film);

  return (
    <Modal
      open={film !== undefined}
      labelledBy={TITLE_ID}
      onClose={onClose}
      fallbackFocusId={shownFilm ? logButtonId(shownFilm.episode_id) : ''}
    >
      {shownFilm && (
        // Keyed by film so the form and its error state start fresh per film.
        <ViewingLog
          key={shownFilm.episode_id}
          film={shownFilm}
          viewings={getViewings(shownFilm.episode_id)}
          onAdd={(viewing) => onAdd(shownFilm.episode_id, viewing)}
          onRemove={(id) => onRemove(shownFilm.episode_id, id)}
        />
      )}
    </Modal>
  );
}

interface ViewingLogProps {
  film: Film;
  viewings: Viewing[];
  onAdd: (viewing: NewViewing) => void;
  onRemove: (viewingId: string) => void;
}

function ViewingLog({ film, viewings, onAdd, onRemove }: ViewingLogProps) {
  const [status, setStatus] = useState('');
  const [invalid, setInvalid] = useState<Record<RequiredField, boolean>>({
    date: false,
    time: false,
  });

  const listRef = useRef<HTMLUListElement>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);
  const focusAfterDelete = useRef<number | null>(null);
  const announceTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(announceTimer.current), []);

  // After a delete, focus the next delete button, else the previous one,
  // else the date field, so focus never falls back to <body>.
  useLayoutEffect(() => {
    const index = focusAfterDelete.current;
    if (index === null) return;
    focusAfterDelete.current = null;
    const buttons = listRef.current?.querySelectorAll('button') ?? [];
    const target = buttons[Math.min(index, buttons.length - 1)] ?? dateRef.current;
    target?.focus();
  }, [viewings]);

  /**
   * Mirrors the CSS :user-invalid state into aria-invalid / aria-describedby
   * (required-field-feedback guide). With `announce`, a newly shown error is
   * read out a moment later, after the screen reader has spoken the next field.
   */
  const syncField = (input: HTMLInputElement, announce: boolean) => {
    const field = input.name as RequiredField;
    const isInvalid = input.matches(':user-invalid');
    if (isInvalid && !invalid[field] && announce) {
      window.clearTimeout(announceTimer.current);
      const { label, message } = REQUIRED_FIELDS[field];
      announceTimer.current = window.setTimeout(
        () => setStatus(`${label}: ${message}`),
        ERROR_ANNOUNCE_DELAY_MS,
      );
    }
    if (invalid[field] !== isInvalid) setInvalid({ ...invalid, [field]: isInvalid });
  };

  const fieldProps = (field: RequiredField) => ({
    id: `viewing-${field}`,
    name: field,
    required: true,
    'aria-invalid': invalid[field],
    'aria-describedby': invalid[field] ? REQUIRED_FIELDS[field].errorId : undefined,
    onBlur: (event: { currentTarget: HTMLInputElement }) => syncField(event.currentTarget, true),
    onInput: (event: { currentTarget: HTMLInputElement }) => syncField(event.currentTarget, false),
    // A failed submit fires `invalid` and moves focus to the first invalid
    // field, which reads its error, so no extra announcement here.
    onInvalid: (event: { currentTarget: HTMLInputElement }) =>
      syncField(event.currentTarget, false),
  });

  // Only called when native validation passed (no `novalidate`).
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const viewing: NewViewing = {
      date: String(data.get('date')),
      time: String(data.get('time')),
      description: String(data.get('description') ?? ''),
    };
    onAdd(viewing);
    form.reset();
    setInvalid({ date: false, time: false });
    // Specific text, so two adds in a row both change the region and are announced.
    setStatus(`Viewing from ${formatWhen(viewing)} added`);
  };

  const handleDelete = (viewing: Viewing, index: number) => {
    focusAfterDelete.current = index;
    onRemove(viewing.id);
    setStatus(`Viewing from ${formatWhen(viewing)} deleted`);
  };

  return (
    <>
      <header className={styles.header}>
        <h2 id={TITLE_ID} className={styles.title}>
          Viewing log — {film.title}
        </h2>
        <form method="dialog">
          <button type="submit" className={styles.secondary}>
            Close
          </button>
        </form>
      </header>

      <div>
        <h3 className={`label ${styles.subheading}`}>Viewings</h3>
        {viewings.length === 0 ? (
          <p className={styles.muted}>No viewings recorded yet.</p>
        ) : (
          <ul ref={listRef} className={styles.list}>
            {viewings.map((viewing, index) => (
              <li key={viewing.id} className={styles.item}>
                <div>
                  <time dateTime={`${viewing.date}T${viewing.time}`} className={styles.when}>
                    {formatWhen(viewing)}
                  </time>
                  {viewing.description && (
                    <p className={styles.description}>{viewing.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => handleDelete(viewing, index)}
                >
                  Delete{' '}
                  <span className="visually-hidden">viewing from {formatWhen(viewing)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h3 className={`label ${styles.subheading}`}>Add a viewing</h3>
        <div className={styles.row}>
          {(['date', 'time'] as const).map((field) => (
            <div key={field} className={styles.field}>
              <label htmlFor={`viewing-${field}`} className={styles.fieldLabel}>
                {REQUIRED_FIELDS[field].label} (required)
              </label>
              <input
                type={field}
                className={styles.input}
                {...fieldProps(field)}
                // React handles autoFocus itself and never writes the
                // attribute, so the native dialog could not find it (D-032).
                ref={
                  field === 'date'
                    ? (input) => {
                        dateRef.current = input;
                        input?.setAttribute('autofocus', '');
                      }
                    : undefined
                }
              />
              <p id={REQUIRED_FIELDS[field].errorId} className={styles.error}>
                {REQUIRED_FIELDS[field].message}
              </p>
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label htmlFor="viewing-description" className={styles.fieldLabel}>
            Description (optional)
          </label>
          <textarea
            id="viewing-description"
            name="description"
            maxLength={500}
            rows={3}
            className={styles.input}
          />
        </div>
        <button type="submit" className={styles.primary}>
          Add viewing
        </button>
      </form>

      {/* The page is inert while the dialog is open, so the page announcer is
          unreachable; the dialog has its own polite region. */}
      <div role="status" className="visually-hidden">
        {status}
      </div>
    </>
  );
}
