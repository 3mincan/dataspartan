import axe from 'axe-core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Film, Person } from './api/types';
import { App } from './App';

vi.mock('./api/swapi', () => ({
  getFilms: vi.fn(),
  getPerson: vi.fn(),
}));

const { getFilms, getPerson } = await import('./api/swapi');

const films: Film[] = [
  {
    title: 'The Empire Strikes Back',
    episode_id: 5,
    opening_crawl: 'It is a dark time for the Rebellion.',
    release_date: '1980-05-17',
    characters: [],
    url: 'https://swapi.dev/api/films/2/',
  },
  {
    title: 'A New Hope',
    episode_id: 4,
    opening_crawl: 'It is a period of civil war.',
    release_date: '1977-05-25',
    characters: ['https://swapi.dev/api/people/1/', 'https://swapi.dev/api/people/2/'],
    url: 'https://swapi.dev/api/films/1/',
  },
];

const people: Record<string, Person> = Object.fromEntries(
  [
    [1, 'Luke Skywalker'],
    [2, 'C-3PO'],
  ].map(([id, name]) => {
    const url = `https://swapi.dev/api/people/${id}/`;
    return [
      url,
      {
        name: String(name),
        height: '172',
        mass: '77',
        birth_year: '19BBY',
        species: [],
        homeworld: 'https://swapi.dev/api/planets/1/',
        url,
      },
    ];
  }),
);

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  vi.mocked(getFilms).mockResolvedValue(films);
  vi.mocked(getPerson).mockImplementation(async (url: string) => {
    const person = people[url];
    if (!person) throw new Error(`Unexpected request: ${url}`);
    return person;
  });
});

it('renders the shell: skip link, labelled nav, one main with the heading', async () => {
  const { container } = render(<App />);

  const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
  const heading = screen.getByRole('heading', { level: 1 });
  expect(skipLink).toHaveAttribute('href', `#${heading.id}`);
  expect(heading).toHaveAttribute('tabindex', '-1');

  expect(screen.getByRole('navigation', { name: 'Films' })).toBeInTheDocument();
  expect(screen.getAllByRole('main')).toHaveLength(1);
  expect(screen.getByText(/select a film/i)).toBeInTheDocument();
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(document.title).toBe('Star Wars Films');

  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
});

it('titles the page after the film in the URL once films load', async () => {
  window.history.replaceState(null, '', '/?film=4');
  render(<App />);
  await waitFor(() => expect(document.title).toBe('A New Hope – Star Wars Films'));
});

it('titles the page after an open viewing log', async () => {
  window.history.replaceState(null, '', '/?film=4&log=4');
  render(<App />);
  await waitFor(() => expect(document.title).toBe('Viewing log: A New Hope – Star Wars Films'));
});

it('selecting a film updates the URL, heading, title and announcement', async () => {
  render(<App />);
  await userEvent.click(await screen.findByRole('link', { name: '4 - A New Hope' }));

  expect(window.location.search).toBe('?film=4');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('4 - A New Hope');
  expect(screen.getByRole('link', { name: '4 - A New Hope' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('status')).toHaveTextContent('Showing A New Hope');
  expect(document.title).toBe('A New Hope – Star Wars Films');
});

it('shows "Film not found" for an unknown film in the URL', async () => {
  window.history.replaceState(null, '', '/?film=99');
  const { container } = render(<App />);

  expect(await screen.findByRole('heading', { level: 1, name: 'Film not found' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Show all films' })).toHaveAttribute('href', '.');
  expect(document.title).toBe('Film not found – Star Wars Films');

  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
});

it('shows a retry button when films fail to load, and recovers', async () => {
  vi.mocked(getFilms).mockRejectedValueOnce(new Error('Network down'));
  render(<App />);

  await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('link', { name: '4 - A New Hope' })).toBeInTheDocument();
});

it('shows the crawl and cast of the selected film; a character deep link selects it', async () => {
  window.history.replaceState(null, '', '/?film=4&character=2');
  const { container } = render(<App />);

  expect(await screen.findByText('It is a period of civil war.')).toBeInTheDocument();
  const threepio = await screen.findByRole('link', { name: 'C-3PO' });
  expect(threepio).toHaveAttribute('aria-current', 'true');
  expect(screen.getByRole('heading', { level: 2, name: 'C-3PO' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Showing details for C-3PO');
  expect(document.title).toBe('C-3PO – A New Hope – Star Wars Films');

  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
});

it('selecting a character, then another film, clears the character', async () => {
  window.history.replaceState(null, '', '/?film=4');
  render(<App />);

  await userEvent.click(await screen.findByRole('link', { name: 'Luke Skywalker' }));
  expect(window.location.search).toBe('?film=4&character=1');
  expect(screen.getByRole('heading', { level: 2, name: 'Luke Skywalker' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('link', { name: '5 - The Empire Strikes Back' }));
  expect(window.location.search).toBe('?film=5');
  expect(screen.queryByRole('heading', { name: 'Luke Skywalker' })).not.toBeInTheDocument();
  expect(screen.getByText('Select a character to see their details.')).toBeInTheDocument();
});

it('shows "Character not found in this film" for a character outside the cast', async () => {
  window.history.replaceState(null, '', '/?film=4&character=99');
  render(<App />);
  expect(await screen.findByText('Character not found in this film.')).toBeInTheDocument();
});
