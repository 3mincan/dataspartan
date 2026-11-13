import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { Film } from '../../api/types';
import { FilmDetails } from './FilmDetails';

const film: Film = {
  title: 'A New Hope',
  episode_id: 4,
  opening_crawl: 'It is a period of civil war.\r\nRebel spaceships, striking',
  characters: [],
  url: 'https://swapi.dev/api/films/1/',
};

it('shows the heading, the opening crawl as text, and the cast section', async () => {
  const { container } = render(
    <main>
      <FilmDetails
        film={film}
        headingId="main-heading"
        cast={{ status: 'success', data: [], retry: vi.fn() }}
        selectedCharacterId={null}
        onSelectCharacter={vi.fn()}
        characterPanel={<p>Select a character</p>}
      />
    </main>,
  );

  const heading = screen.getByRole('heading', { level: 1, name: '4 - A New Hope' });
  expect(heading).toHaveAttribute('id', 'main-heading');
  expect(screen.getByRole('heading', { level: 2, name: 'Opening crawl' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Cast' })).toBeInTheDocument();
  expect(screen.getByText(/It is a period of civil war\.\s+Rebel spaceships/)).toBeInTheDocument();
  expect(screen.getByText('Select a character')).toBeInTheDocument();

  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
});

it('renders markup in the crawl as text, never as HTML', () => {
  render(
    <FilmDetails
      film={{ ...film, opening_crawl: '<img src=x onerror="alert(1)">' }}
      headingId="main-heading"
      cast={{ status: 'loading', retry: vi.fn() }}
      selectedCharacterId={null}
      onSelectCharacter={vi.fn()}
      characterPanel={null}
    />,
  );
  expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeInTheDocument();
  expect(document.querySelector('img')).toBeNull();
});
