import {
  GENRE_MAP, VIBE_GENRES, COMPANY_GENRES, TIME_RANGES, ERA_RANGES,
} from '../data/answerMappings';
import { toMovieGenres } from '../api/tmdb';

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// First pick counts fully, later picks a bit less.
const rankWeight = (i) => [1, 0.7, 0.5][i] ?? 0.4;

// How much each question shapes the genre taste.
const SOURCES = [
  ['vibe', VIBE_GENRES, 2.5],
  ['company', COMPANY_GENRES, 1],
];
const GENRE_QUESTION_WEIGHT = 4;
// Titles with none of the explicitly chosen genres keep only this share of their genre fit.
const OFF_GENRE_FIT = 0.6;

// Genres that end up this negative are filtered out of results entirely.
const AVOID_BELOW = -1;

// Animation, documentaries, music films and TV movies are rarely wanted unless asked for,
// so they count against the fit when the answers don't lean toward them.
const NICHE_GENRES = [16, 99, 10402, 10770];
const NICHE_PENALTY = 0.35;

const profiles = new WeakMap();

// Turns quiz answers into a genre taste plus the hard constraints (eras, runtimes, languages).
export function buildProfile(answers) {
  if (profiles.has(answers)) return profiles.get(answers);

  const weights = new Map();
  const add = (genreId, w) => weights.set(genreId, (weights.get(genreId) || 0) + w);

  toArray(answers.genre).forEach((id, i) => {
    if (GENRE_MAP[id]) add(GENRE_MAP[id], GENRE_QUESTION_WEIGHT * rankWeight(i));
  });
  for (const [question, table, sourceWeight] of SOURCES) {
    toArray(answers[question]).forEach((id, i) => {
      for (const [genreId, w] of Object.entries(table[id] || {})) {
        add(Number(genreId), sourceWeight * rankWeight(i) * w);
      }
    });
  }

  const profile = {
    weights,
    // Genres picked directly, in rank order: these decide what, the other answers tune the tone.
    explicit: toArray(answers.genre).map((id) => GENRE_MAP[id]).filter(Boolean),
    liked: [...weights].filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]),
    avoided: [...weights].filter(([, w]) => w <= AVOID_BELOW).map(([g]) => g),
    eras: toArray(answers.era).filter((e) => ERA_RANGES[e]),
    times: toArray(answers.time).filter((t) => TIME_RANGES[t]),
    languages: toArray(answers.language),
  };
  profiles.set(answers, profile);
  return profile;
}

export function inAnyEra(date, eras) {
  if (!date) return false;
  return eras.some((e) => date >= ERA_RANGES[e][0] && date <= ERA_RANGES[e][1]);
}

// The smallest date range covering all chosen eras.
export function eraSpan(eras) {
  const ranges = eras.map((e) => ERA_RANGES[e]);
  return [ranges.map((r) => r[0]).sort()[0], ranges.map((r) => r[1]).sort().at(-1)];
}

// Whether a runtime fits the chosen time buckets, with a little slack either side.
export function fitsTimes(runtime, times) {
  const [min, max] = timeSpan(times);
  return runtime >= min - 5 && runtime <= max + 10;
}

export function timeSpan(times) {
  const ranges = times.map((t) => TIME_RANGES[t]);
  return [Math.min(...ranges.map((r) => r[0])), Math.max(...ranges.map((r) => r[1]))];
}

// Share of each part of the answers a title satisfies, 0-100. Only answered questions count.
export function computeMatchScore(item, answers) {
  const p = buildProfile(answers);
  let score = 0;
  let total = 0;

  if (p.liked.length > 0) {
    const genres = toMovieGenres(item.genre_ids || item.genres?.map((g) => g.id) || [], item.media_type);
    // Hitting the top genre plus half of the second counts as a full genre match.
    const [first, second] = p.liked;
    const target = first[1] + (second ? second[1] * 0.5 : 0);
    const hit = genres.reduce((sum, g) => sum + (p.weights.get(g) || 0), 0);
    const niche = genres.filter((g) => NICHE_GENRES.includes(g) && !(p.weights.get(g) > 0)).length;
    let fit = Math.max(0, Math.min(1, hit / target) - niche * NICHE_PENALTY);
    if (p.explicit.length > 0 && !p.explicit.some((g) => genres.includes(g))) fit *= OFF_GENRE_FIT;
    score += fit * 60;
    total += 60;
  }

  if (p.eras.length > 0) {
    total += 15;
    if (inAnyEra(item.release_date, p.eras)) score += 15;
  }

  if (p.languages.length > 0) {
    total += 15;
    if (p.languages.includes(item.original_language)) score += 15;
  }

  if (p.times.length > 0 && item.runtime && item.media_type !== 'tv') {
    total += 10;
    if (p.times.some((t) => item.runtime >= TIME_RANGES[t][0] && item.runtime <= TIME_RANGES[t][1])) score += 10;
  }

  if (total === 0) return 100;
  return Math.round((score / total) * 100);
}

// 0-100 from TMDB votes, pulling titles with few votes toward the average
// so a 9.5 from 12 people doesn't outrank a 8.4 from 20,000.
export function qualityScore(item) {
  const votes = item.vote_count || 0;
  const prior = 200;
  const rating = (votes / (votes + prior)) * (item.vote_average || 0) + (prior / (votes + prior)) * 6.5;
  return Math.max(0, Math.min(1, (rating - 5) / 3.5)) * 100;
}
