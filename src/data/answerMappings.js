// Quiz genre -> TMDB movie genre id.
export const GENRE_MAP = {
  action: 28,
  comedy: 35,
  drama: 18,
  thriller: 53,
  crime: 80,
  horror: 27,
  scifi: 878,
  fantasy: 14,
  romance: 10749,
  animation: 16,
};

// How strongly each answer pulls toward (positive) or away from (negative) TMDB movie genres.
// 28 Action, 12 Adventure, 16 Animation, 35 Comedy, 80 Crime, 99 Documentary, 18 Drama,
// 10751 Family, 14 Fantasy, 36 History, 27 Horror, 10402 Music, 9648 Mystery,
// 10749 Romance, 878 Sci-Fi, 53 Thriller, 10752 War
export const VIBE_GENRES = {
  funny: { 35: 1, 10751: 0.4, 10749: 0.3, 16: 0.3, 27: -1, 10752: -0.6 },
  thrilling: { 53: 1, 80: 0.7, 28: 0.6, 9648: 0.6, 10751: -0.6 },
  epic: { 12: 1, 28: 0.9, 878: 0.7, 14: 0.7 },
  emotional: { 18: 1, 10749: 0.5, 10402: 0.3, 36: 0.3 },
  romantic: { 10749: 1, 35: 0.5, 18: 0.4 },
  scary: { 27: 1, 53: 0.6, 9648: 0.4 },
  mindbending: { 878: 0.8, 9648: 0.8, 53: 0.6, 18: 0.3 },
  chill: { 35: 0.8, 16: 0.5, 10751: 0.5, 10749: 0.4, 99: 0.3, 27: -1, 10752: -0.8, 53: -0.5 },
};

export const COMPANY_GENRES = {
  solo: {},
  date: { 10749: 0.7, 35: 0.5, 18: 0.4 },
  friends: { 35: 0.8, 28: 0.6, 27: 0.5, 12: 0.4 },
  family: { 10751: 1, 16: 0.8, 35: 0.5, 12: 0.5, 27: -1.2, 53: -0.6, 80: -0.6, 10752: -0.6 },
};

// Runtime buckets in minutes (movies only; TV runtimes are per episode).
export const TIME_RANGES = {
  short: [0, 90],
  medium: [90, 125],
  long: [125, Infinity],
};

export const ERA_RANGES = {
  recent: ['2020-01-01', '9999-12-31'],
  '2010s': ['2010-01-01', '2019-12-31'],
  '2000s': ['1990-01-01', '2009-12-31'],
  classics: ['1900-01-01', '1989-12-31'],
};

// Quiz format -> media types to search.
export const FORMAT_TYPES = {
  movie: ['movie'],
  tv: ['tv'],
  either: ['movie', 'tv'],
  short: ['short'],
};

// TMDB keyword ids behind the "Mind-bending" vibe: mind-bending, time travel,
// psychological thriller, twist ending, nonlinear timeline, surrealism, parallel world.
export const MINDBENDING_KEYWORDS = [362567, 4379, 12565, 326438, 157171, 9887, 33465];

// Highest US rating allowed for family viewing.
export const FAMILY_CERT = { movie: 'PG', tv: 'TV-PG' };
