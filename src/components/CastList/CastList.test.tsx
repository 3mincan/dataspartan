import axe from 'axe-core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Person } from '../../api/types';
import type { AsyncResult } from '../../hooks/useAsync';
import { CastList } from './CastList';

const person = (id: number, name: string): Person => ({
  name,
  height: '172',
  mass: '77',
  birth_year: '19BBY',
  species: [],
  homeworld: 'https://swapi.dev/api/planets/1/',
  url: `https://swapi.dev/api/people/${id}/`,
});

const retry = vi.fn();
const success: AsyncResult<Person[]> = {
  status: 'success',
  data: [person(1, 'Luke Skywalker'), person(2, 'C-3PO')],
  retry,
};

function renderCast(cast: AsyncResult<Person[]>, selectedId: number | null = null) {
  const onSelect = vi.fn();
  const utils = render(
    <main>
      <CastList filmId={4} cast={cast} selectedId={selectedId} onSelect={onSelect} />
    </main>,
  );
  return { ...utils, onSelect };
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('CastList', () => {
  it('shows a labelled progress bar while loading', async () => {
    const { container } = renderCast({ status: 'loading', retry });
    expect(screen.getByRole('progressbar', { name: 'Loading cast' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('shows an alert with retry on error', async () => {
    renderCast({ status: 'error', error: new Error('500'), retry });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('The cast could not be loaded.');
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('shows an empty state', () => {
    renderCast({ status: 'success', data: [], retry });
    expect(screen.getByText('No cast listed for this film.')).toBeInTheDocument();
  });

  it('lists characters as links within the film and marks the selected one', async () => {
    const { container } = renderCast(success, 2);
    const luke = screen.getByRole('link', { name: 'Luke Skywalker' });
    const threepio = screen.getByRole('link', { name: 'C-3PO' });

    expect(luke).toHaveAttribute('href', '?film=4&character=1');
    expect(luke).not.toHaveAttribute('aria-current');
    expect(threepio).toHaveAttribute('aria-current', 'true');
    await expectNoAxeViolations(container);
  });

  it('selects a character on a plain click', async () => {
    const { onSelect } = renderCast(success);
    await userEvent.click(screen.getByRole('link', { name: 'C-3PO' }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
