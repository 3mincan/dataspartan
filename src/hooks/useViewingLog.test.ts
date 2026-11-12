import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useViewingLog } from './useViewingLog';

describe('useViewingLog', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useViewingLog());
    expect(result.current.getViewings(4)).toEqual([]);
  });

  it('adds a viewing with an id, trimming the description', () => {
    const { result } = renderHook(() => useViewingLog());
    act(() =>
      result.current.addViewing(4, { date: '2026-11-12', time: '20:30', description: '  IMAX  ' }),
    );

    const [viewing] = result.current.getViewings(4);
    expect(viewing).toMatchObject({ date: '2026-11-12', time: '20:30', description: 'IMAX' });
    expect(viewing?.id).toEqual(expect.any(String));
  });

  it('omits an empty description', () => {
    const { result } = renderHook(() => useViewingLog());
    act(() => result.current.addViewing(4, { date: '2026-11-12', time: '20:30', description: '  ' }));
    expect(result.current.getViewings(4)[0]).not.toHaveProperty('description');
  });

  it('keeps several viewings of one film, newest first', () => {
    const { result } = renderHook(() => useViewingLog());
    act(() => {
      result.current.addViewing(4, { date: '2026-01-01', time: '10:00' });
      result.current.addViewing(4, { date: '2026-03-01', time: '09:00' });
      result.current.addViewing(4, { date: '2026-01-01', time: '18:00' });
    });

    expect(result.current.getViewings(4).map((v) => `${v.date} ${v.time}`)).toEqual([
      '2026-03-01 09:00',
      '2026-01-01 18:00',
      '2026-01-01 10:00',
    ]);
  });

  it('removes one viewing', () => {
    const { result } = renderHook(() => useViewingLog());
    act(() => {
      result.current.addViewing(4, { date: '2026-01-01', time: '10:00' });
      result.current.addViewing(4, { date: '2026-02-01', time: '10:00' });
    });
    const [newest, oldest] = result.current.getViewings(4);

    act(() => result.current.removeViewing(4, newest?.id ?? ''));
    expect(result.current.getViewings(4)).toEqual([oldest]);
  });

  it('keeps films isolated', () => {
    const { result } = renderHook(() => useViewingLog());
    act(() => result.current.addViewing(4, { date: '2026-01-01', time: '10:00' }));
    expect(result.current.getViewings(5)).toEqual([]);
  });
});
