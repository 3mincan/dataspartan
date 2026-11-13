import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAsync } from './useAsync';

/** A promise the test settles by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAsync', () => {
  it('is idle for a null key and never calls the loader', () => {
    let calls = 0;
    const { result } = renderHook(() => useAsync(null, () => Promise.resolve(++calls)));
    expect(result.current.status).toBe('idle');
    expect(calls).toBe(0);
  });

  it('goes from loading to success', async () => {
    const { result } = renderHook(() => useAsync('a', () => Promise.resolve('A')));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current).toMatchObject({ status: 'success', data: 'A' }));
  });

  it('never shows the result of a superseded key', async () => {
    const pending = { a: deferred<string>(), b: deferred<string>() };
    const { result, rerender } = renderHook(({ key }) => useAsync(key, () => pending[key].promise), {
      initialProps: { key: 'a' as 'a' | 'b' },
    });

    rerender({ key: 'b' });
    expect(result.current.status).toBe('loading');

    // The old request finishes last-but-one: it must be ignored.
    await act(async () => pending.a.resolve('A'));
    expect(result.current.status).toBe('loading');

    await act(async () => pending.b.resolve('B'));
    expect(result.current).toMatchObject({ status: 'success', data: 'B' });
  });

  it('reports an error and runs again on retry', async () => {
    let attempt = 0;
    const { result } = renderHook(() =>
      useAsync('a', () => (++attempt === 1 ? Promise.reject(new Error('boom')) : Promise.resolve('ok'))),
    );
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toBe('boom');

    act(() => result.current.retry());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current).toMatchObject({ status: 'success', data: 'ok' }));
    expect(attempt).toBe(2);
  });

  it('wraps non-Error rejections', async () => {
    const { result } = renderHook(() => useAsync('a', () => Promise.reject('nope')));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
