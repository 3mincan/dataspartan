import axe from 'axe-core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Film } from '../../api/types';
import type { AsyncResult } from '../../hooks/useAsync';
import { FilmList } from './FilmList';

const film = (episode_id: number, title: string): Film => ({
  title,
  episode_id,
  opening_crawl: '',
  release_date: '',
  characters: [],
  url: `https://swapi.dev/api/films/${episode_id}/`,
});

const films = [film(4, 'A New Hope'), film(5, 'The Empire Strikes Back')];
const retry = vi.fn();
const success: AsyncResult<Film[]> = { status: 'success', data: films, retry };

function renderList(
  state: AsyncResult<Film[]>,
  selectedFilmId: number | null = null,
  viewingCount: (filmId: number) => number = () => 0,
) {
  const onSelect = vi.fn();
  const onOpenLog = vi.fn();
  const utils = render(
    <nav aria-label="Films">
      <FilmList
        films={state}
        selectedFilmId={selectedFilmId}
        onSelect={onSelect}
        onOpenLog={onOpenLog}
        viewingCount={viewingCount}
      />
    </nav>,
  );
  return { ...utils, onSelect, onOpenLog };
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('FilmList', () => {
  it('shows a labelled progress bar while loading', async () => {
    const { container } = renderList({ status: 'loading', retry });
    expect(screen.getByRole('progressbar', { name: 'Loading films' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('shows an alert with a working retry button on error', async () => {
    const { container } = renderList({ status: 'error', error: new Error('500'), retry });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Films could not be loaded.');

    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
    await expectNoAxeViolations(container);
  });

  it('shows an empty state', () => {
    renderList({ status: 'success', data: [], retry });
    expect(screen.getByText('No films found.')).toBeInTheDocument();
  });

  it('lists films as links "<episode> - <title>" and marks the selected one', async () => {
    const { container } = renderList(success, 5);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);

    const hope = screen.getByRole('link', { name: '4 - A New Hope' });
    const empire = screen.getByRole('link', { name: '5 - The Empire Strikes Back' });
    expect(hope).toHaveAttribute('href', '?film=4');
    expect(hope).not.toHaveAttribute('aria-current');
    expect(empire).toHaveAttribute('aria-current', 'page');
    await expectNoAxeViolations(container);
  });

  it('handles a plain click in-app', async () => {
    const { onSelect } = renderList(success);
    await userEvent.click(screen.getByRole('link', { name: '4 - A New Hope' }));
    expect(onSelect).toHaveBeenCalledWith(4);
  });

  it('leaves modified clicks to the browser (open in new tab)', async () => {
    const { onSelect } = renderList(success);
    // jsdom cannot open tabs; stop it from following the link after our
    // handler has seen (and ignored) the click.
    const blockNavigation = (event: Event) => event.preventDefault();
    document.addEventListener('click', blockNavigation);
    const user = userEvent.setup();
    await user.keyboard('{Control>}');
    await user.click(screen.getByRole('link', { name: '4 - A New Hope' }));
    await user.keyboard('{/Control}');
    document.removeEventListener('click', blockNavigation);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('has a viewing log button per film that opens a dialog', async () => {
    const { onOpenLog } = renderList(success);
    const button = screen.getByRole('button', { name: 'Viewing log for The Empire Strikes Back' });
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');

    await userEvent.click(button);
    expect(onOpenLog).toHaveBeenCalledWith(5);
  });

  it('shows the number of viewings on the log button', () => {
    renderList(success, null, (filmId) => (filmId === 4 ? 2 : 0));
    expect(
      screen.getByRole('button', { name: 'Viewing log for A New Hope, 2 viewings' }),
    ).toHaveTextContent('Log');
    expect(
      screen.getByRole('button', { name: 'Viewing log for The Empire Strikes Back' }),
    ).toBeInTheDocument();
  });
});
