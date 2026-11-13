import { getPerson, getPlanet, getSpecies } from '../api/swapi';
import type { CharacterDetails } from '../api/types';
import { HUMAN_FALLBACK, isDroid } from '../utils/character';
import { useAsync, type AsyncResult } from './useAsync';

export async function loadCharacterDetails(personUrl: string): Promise<CharacterDetails> {
  const person = await getPerson(personUrl);
  const species = await Promise.all(person.species.map(getSpecies));

  if (isDroid(species)) {
    return {
      kind: 'robot',
      name: person.name,
      height: person.height,
      mass: person.mass,
      manufacturingYear: person.birth_year,
    };
  }

  const homeworld = await getPlanet(person.homeworld);
  const primarySpecies = species[0] ?? HUMAN_FALLBACK;

  return {
    kind: 'organic',
    name: person.name,
    speciesName: primarySpecies.name,
    speciesClassification: primarySpecies.classification,
    homeworldName: homeworld.name,
    height: person.height,
    birthYear: person.birth_year,
  };
}

/** Resolves the detail view model for the selected cast entry. */
export function useCharacterDetails(personUrl: string | null): AsyncResult<CharacterDetails> {
  return useAsync(personUrl, async () => {
    // Never runs with a null key (useAsync stays idle); narrows the type.
    if (!personUrl) throw new Error('No character selected.');
    return loadCharacterDetails(personUrl);
  });
}
