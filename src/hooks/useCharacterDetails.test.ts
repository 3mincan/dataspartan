import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Person, Planet, Species } from '../api/types';
import { loadCharacterDetails } from './useCharacterDetails';

vi.mock('../api/swapi', () => ({
  getPerson: vi.fn(),
  getSpecies: vi.fn(),
  getPlanet: vi.fn(),
}));

const { getPerson, getSpecies, getPlanet } = await import('../api/swapi');

const TATOOINE: Planet = { name: 'Tatooine', url: 'https://swapi.dev/api/planets/1/' };
const DROID: Species = {
  name: 'Droid',
  classification: 'artificial',
  url: 'https://swapi.dev/api/species/2/',
};
const YODA_SPECIES: Species = {
  name: "Yoda's species",
  classification: 'mammal',
  url: 'https://swapi.dev/api/species/6/',
};

function person(overrides: Partial<Person>): Person {
  return {
    name: 'Someone',
    height: '100',
    mass: '50',
    birth_year: '10BBY',
    species: [],
    homeworld: TATOOINE.url,
    url: 'https://swapi.dev/api/people/1/',
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(getPlanet).mockResolvedValue(TATOOINE);
  vi.mocked(getSpecies).mockImplementation(async (url) =>
    url === DROID.url ? DROID : YODA_SPECIES,
  );
});

describe('loadCharacterDetails', () => {
  it('builds a robot view model for droids, with birth year as manufacturing year', async () => {
    vi.mocked(getPerson).mockResolvedValue(
      person({ name: 'C-3PO', height: '167', mass: '75', birth_year: '112BBY', species: [DROID.url] }),
    );

    await expect(loadCharacterDetails('https://swapi.dev/api/people/2/')).resolves.toEqual({
      kind: 'robot',
      name: 'C-3PO',
      height: '167',
      mass: '75',
      manufacturingYear: '112BBY',
    });
    expect(getPlanet).not.toHaveBeenCalled();
  });

  it('builds an organic view model with species and homeworld for non-humans', async () => {
    vi.mocked(getPerson).mockResolvedValue(
      person({ name: 'Yoda', height: '66', birth_year: '896BBY', species: [YODA_SPECIES.url] }),
    );

    await expect(loadCharacterDetails('https://swapi.dev/api/people/20/')).resolves.toEqual({
      kind: 'organic',
      name: 'Yoda',
      speciesName: "Yoda's species",
      speciesClassification: 'mammal',
      homeworldName: 'Tatooine',
      height: '66',
      birthYear: '896BBY',
    });
  });

  it('falls back to Human / mammal when SWAPI lists no species', async () => {
    vi.mocked(getPerson).mockResolvedValue(person({ name: 'Luke Skywalker', species: [] }));

    const details = await loadCharacterDetails('https://swapi.dev/api/people/1/');
    expect(details).toMatchObject({
      kind: 'organic',
      speciesName: 'Human',
      speciesClassification: 'mammal',
      homeworldName: 'Tatooine',
    });
    expect(getSpecies).not.toHaveBeenCalled();
  });

  it('propagates request failures so the card can offer a retry', async () => {
    vi.mocked(getPerson).mockResolvedValue(person({ species: [] }));
    vi.mocked(getPlanet).mockRejectedValue(new Error('SWAPI responded with 500.'));
    await expect(loadCharacterDetails('https://swapi.dev/api/people/1/')).rejects.toThrow('500');
  });
});
