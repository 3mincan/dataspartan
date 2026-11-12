import { useCallback, useState } from 'react';
import type { NewViewing, Viewing } from '../api/types';

type ViewingsByFilm = Record<number, Viewing[]>;

const EMPTY: Viewing[] = [];

function byMostRecent(a: Viewing, b: Viewing): number {
  return `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`);
}

export interface ViewingLog {
  getViewings: (filmId: number) => Viewing[];
  addViewing: (filmId: number, viewing: NewViewing) => void;
  removeViewing: (filmId: number, viewingId: string) => void;
}

/**
 * In-memory viewing log, keyed by film `episode_id`.
 * Call once in <App /> and pass down; state is lost on reload by design.
 */
export function useViewingLog(initial: ViewingsByFilm = {}): ViewingLog {
  const [viewings, setViewings] = useState<ViewingsByFilm>(initial);

  const getViewings = useCallback(
    (filmId: number) => viewings[filmId] ?? EMPTY,
    [viewings],
  );

  const addViewing = useCallback((filmId: number, viewing: NewViewing) => {
    const description = viewing.description?.trim();
    const entry: Viewing = {
      id: crypto.randomUUID(),
      date: viewing.date,
      time: viewing.time,
      ...(description ? { description } : {}),
    };
    setViewings((prev) => ({
      ...prev,
      [filmId]: [...(prev[filmId] ?? []), entry].sort(byMostRecent),
    }));
  }, []);

  const removeViewing = useCallback((filmId: number, viewingId: string) => {
    setViewings((prev) => ({
      ...prev,
      [filmId]: (prev[filmId] ?? []).filter((v) => v.id !== viewingId),
    }));
  }, []);

  return { getViewings, addViewing, removeViewing };
}
