/** Raw SWAPI resources (only the fields the app uses). */

export interface Film {
  title: string;
  episode_id: number;
  opening_crawl: string;
  release_date: string;
  /** URLs of the people appearing in the film. */
  characters: string[];
  url: string;
}

export interface Person {
  name: string;
  /** Centimetres as a string, or "unknown". */
  height: string;
  /** Kilograms as a string, or "unknown". */
  mass: string;
  /** e.g. "19BBY", or "unknown". For droids this is the manufacturing year. */
  birth_year: string;
  /** Species URLs. Empty for humans on swapi.dev. */
  species: string[];
  /** Planet URL. */
  homeworld: string;
  url: string;
}

export interface Species {
  name: string;
  classification: string;
  url: string;
}

export interface Planet {
  name: string;
  url: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** View models */

export interface RobotDetails {
  kind: 'robot';
  name: string;
  height: string;
  mass: string;
  manufacturingYear: string;
}

export interface OrganicDetails {
  kind: 'organic';
  name: string;
  speciesName: string;
  speciesClassification: string;
  homeworldName: string;
  height: string;
  birthYear: string;
}

export type CharacterDetails = RobotDetails | OrganicDetails;

export interface Viewing {
  id: string;
  /** ISO date, YYYY-MM-DD (value of <input type="date">). */
  date: string;
  /** 24h time, HH:mm (value of <input type="time">). */
  time: string;
  description?: string;
}

export type NewViewing = Omit<Viewing, 'id'>;
