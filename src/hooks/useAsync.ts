import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> =
  | { status: 'idle'; data?: undefined; error?: undefined }
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

export type AsyncResult<T> = AsyncState<T> & { retry: () => void };

type Settled<T> =
  | { runId: string; status: 'success'; data: T }
  | { runId: string; status: 'error'; error: Error };

/**
 * Runs `fn` whenever `key` changes (or `retry` is called).
 * A `null` key means "nothing to load" and yields the idle state.
 *
 * Only the settled outcome is stored, tagged with the run it belongs to.
 * Idle and loading are derived during render, so a result for a previous
 * key can never be shown for the current one.
 */
export function useAsync<T>(key: string | null, fn: () => Promise<T>): AsyncResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const runId = key === null ? null : `${attempt}:${key}`;

  useEffect(() => {
    if (runId === null) return;

    let cancelled = false;

    fnRef.current().then(
      (data) => {
        if (!cancelled) setSettled({ runId, status: 'success', data });
      },
      (error: unknown) => {
        if (cancelled) return;
        setSettled({
          runId,
          status: 'error',
          error: error instanceof Error ? error : new Error('Unexpected error'),
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [runId]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  let state: AsyncState<T>;
  if (runId === null) {
    state = { status: 'idle' };
  } else if (settled?.runId !== runId) {
    state = { status: 'loading' };
  } else if (settled.status === 'success') {
    state = { status: 'success', data: settled.data };
  } else {
    state = { status: 'error', error: settled.error };
  }

  return { ...state, retry };
}
