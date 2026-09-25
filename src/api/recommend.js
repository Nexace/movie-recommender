import { discover, getRuntime, interleave, toTvGenres, TV_GENRES } from './tmdb';
import {
  buildProfile, computeMatchScore, qualityScore, inAnyEra, eraSpan, timeSpan, fitsTimes,
} from '../utils/scoreMatch';
import { FAMILY_CERT, FORMAT_TYPES, MINDBENDING_KEYWORDS } from '../data/answerMappings';

const PRIMARY_COUNT = 36;
const SECONDARY_COUNT = 36;
// Stop loosening filters once a media type has this many candidates.
const ENOUGH_CANDIDATES = 45;
// Loosening steps: 0 all filters, 1 drop runtime, 2 drop era, 3 drop genres.
const MAX_RELAX = 3;
// TMDB's runtime filter is loose, so this many top movies get their real runtime checked.
const RUNTIME_CHECKS = 60;
const SHORT_FILM_KEYWORD = 263548;
const SHORT_MAX_MINUTES = 45;

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);


// Highest US rating allowed for family viewing, or null. Regional films rarely carry a US
// rating, so the cap only applies when English (or any language) is in play.
function certCap(type, answers, profile) {
  if (answers.company !== 'family') return null;
  const langs = profile.languages;
  if (langs.length > 0 && !langs.includes('en')) return null;
  return FAMILY_CERT[type === 'tv' ? 'tv' : 'movie'];
}


// Filters every query for this media type shares.
function baseFilters(type, answers, profile, relax) {
  const params = {};
  const regional = profile.languages.length > 0 && !profile.languages.includes('en');

  if (profile.languages.length > 0) params.with_original_language = profile.languages.join('|');

  if (profile.eras.length > 0 && relax < 2) {
    const [gte, lte] = eraSpan(profile.eras);
    const field = type === 'tv' ? 'first_air_date' : 'primary_release_date';
    params[`${field}.gte`] = gte;
    params[`${field}.lte`] = lte;
  }

  if (type === 'short') {
    params['with_runtime.lte'] = 40;
    params.with_keywords = SHORT_FILM_KEYWORD;
  } else if (type === 'movie') {
    const [min, max] = profile.times.length > 0 && relax < 1 ? timeSpan(profile.times) : [0, Infinity];
    // A floor of 60 minutes keeps short films out of "Movies".
    params['with_runtime.gte'] = Math.max(min, 60);
    if (max !== Infinity) params['with_runtime.lte'] = max;
  }

  const cap = certCap(type, answers, profile);
  if (cap) {
    params.certification_country = 'US';
    params['certification.lte'] = cap;
  }

  // TV genres don't line up one-to-one with movie genres, so only exclude exact matches there.
  const avoided = type === 'tv'
    ? profile.avoided.flatMap((g) => (g === 10752 ? [10768] : TV_GENRES[g] ? [g] : []))
    : profile.avoided;
  if (avoided.length > 0) params.without_genres = avoided.join(',');

  // Enough votes that the rating means something; regional catalogues are smaller.
  params['vote_count.gte'] = type === 'short' ? 5 : regional ? 15 : type === 'tv' ? 60 : 150;
  return params;
}

// The set of discover queries for one media type. Each query is tagged so ranking can
// reward titles that several queries agree on.
function queriesFor(type, answers, profile, relax) {
  // Chosen genres anchor the searches; the strongest genre implied by mood etc. fills the rest.
  const topGenres = [...new Set([...profile.explicit.slice(0, 2), ...profile.liked.map(([g]) => g)])].slice(0, 3);
  const genres = relax >= 3 ? [] : type === 'tv' ? toTvGenres(topGenres).slice(0, 3) : topGenres;
  const regional = profile.languages.length > 0 && !profile.languages.includes('en');
  const queries = [];

  if (genres.length >= 2) {
    const both = `${genres[0]},${genres[1]}`;
    queries.push({ with_genres: both, sort_by: 'popularity.desc' });
    queries.push({ with_genres: both, sort_by: 'vote_average.desc' });
  }
  for (const g of genres) {
    queries.push({ with_genres: g, sort_by: 'popularity.desc' });
    queries.push({ with_genres: g, sort_by: 'vote_average.desc' });
  }
  if (genres.length === 0) {
    queries.push({ sort_by: 'popularity.desc' }, { sort_by: 'popularity.desc', page: 2 }, { sort_by: 'vote_average.desc' });
  }

  // The kind of picks reshapes every query; the mind-bending vibe adds its own keyword search.
  const style = answers.style;
  for (const q of queries) {
    if (style === 'award') {
      q.sort_by = 'vote_average.desc';
      q['vote_count.gte'] = type === 'short' ? 100 : regional ? 150 : type === 'tv' ? 500 : 1500;
      q['vote_average.gte'] = 7.2;
    } else if (style === 'hidden') {
      q.sort_by = 'vote_average.desc';
      q['vote_count.lte'] = type === 'short' || regional ? 400 : 2000;
      q['vote_average.gte'] = 6.5;
    } else if (style === 'crowd') {
      q.sort_by = 'popularity.desc';
    }
  }
  if (toArray(answers.vibe).includes('mindbending') && type !== 'short') {
    const keywords = MINDBENDING_KEYWORDS.join('|');
    queries.push({ with_keywords: keywords, sort_by: 'vote_average.desc', tag: 'mindbending' });
    queries.push({ with_keywords: keywords, sort_by: 'popularity.desc', tag: 'mindbending' });
  }
  return queries;
}

async function candidatesFor(type, answers, profile) {
  const endpoint = type === 'tv' ? 'tv' : 'movie';
  const found = new Map();

  for (let relax = 0; relax <= MAX_RELAX && found.size < ENOUGH_CANDIDATES; relax++) {
    const base = baseFilters(type, answers, profile, relax);
    const queries = queriesFor(type, answers, profile, relax);
    const results = await Promise.all(
      queries.map(({ page = 1, tag, ...q }) =>
        discover(endpoint, { ...base, ...q }, page).then((items) => items.map((item) => ({ item, tag })))
      )
    );

    for (const { item, tag } of results.flat()) {
      if (!item.poster_path) continue;
      // The era span can cover gaps (e.g. Classics + Recent), so check the exact eras too.
      if (profile.eras.length > 0 && relax < 2 && !inAnyEra(item.release_date, profile.eras)) continue;
      const existing = found.get(item.key);
      if (existing) {
        existing.hits += 1;
        if (tag) existing.tags.add(tag);
      } else {
        found.set(item.key, { ...item, hits: 1, tags: new Set(tag ? [tag] : []) });
      }
    }
  }
  return [...found.values()];
}

// Blend of how well a title fits the answers and how good it is, with adjustments for the
// kind of picks asked for.
function rank(items, answers) {
  const style = answers.style;

  return items
    .map(({ tags, hits, ...item }) => {
      const match = computeMatchScore(item, answers);
      let score = match * 0.6 + qualityScore(item) * 0.4;
      // Showing up in several of the queries means it fits more than one angle of the taste.
      score += Math.min(hits - 1, 3) * 2.5;
      if (style === 'crowd') score += Math.min((item.popularity || 0) / 25, 10);
      if (style === 'hidden') score -= Math.min((item.popularity || 0) / 40, 8);
      if (tags.has('mindbending')) score += 10;
      return { ...item, match, rankScore: score };
    })
    .sort((a, b) => b.rankScore - a.rankScore);
}

// Looks up real runtimes for the top movies, drops ones that don't fit, and rescores the rest
// now that their runtime is known. Keeps misfits if too few titles would be left.
async function checkRuntimes(items, answers, fits, minKeep) {
  const head = items.slice(0, RUNTIME_CHECKS);
  const runtimes = await Promise.all(head.map((item) => getRuntime(item.id)));
  const checked = head.map((item, i) => {
    if (!runtimes[i]) return item;
    const withRuntime = { ...item, runtime: runtimes[i] };
    const match = computeMatchScore(withRuntime, answers);
    return { ...withRuntime, match, rankScore: item.rankScore + (match - item.match) * 0.6 };
  });
  const fitting = checked.filter((item) => item.runtime && fits(item.runtime));
  const kept = fitting.length >= minKeep ? fitting : checked;
  return [...kept.sort((a, b) => b.rankScore - a.rankScore), ...items.slice(RUNTIME_CHECKS)];
}

// Ranked recommendations for the quiz answers: `primary` are the best fits and `secondary`
// the next best, with no title in both. Each item carries a `match` percentage.
export async function getRecommendations(answers) {
  const profile = buildProfile(answers);
  const types = FORMAT_TYPES[answers.format] || FORMAT_TYPES.either;

  const perType = await Promise.all(types.map(async (type) => {
    const ranked = rank(await candidatesFor(type, answers, profile), answers);
    if (type === 'short') {
      // Short films must really be short; unknown runtimes are dropped too.
      const checked = await checkRuntimes(ranked, answers, (r) => r <= SHORT_MAX_MINUTES, 0);
      return checked.filter((item) => item.runtime && item.runtime <= SHORT_MAX_MINUTES);
    }
    if (type === 'movie' && profile.times.length > 0) {
      return checkRuntimes(ranked, answers, (r) => fitsTimes(r, profile.times), 24);
    }
    return ranked;
  }));
  // Alternate between the chosen types (in the order the user ranked them) so each is represented.
  const merged = interleave(perType);

  return {
    primary: merged.slice(0, PRIMARY_COUNT),
    secondary: merged.slice(PRIMARY_COUNT, PRIMARY_COUNT + SECONDARY_COUNT),
  };
}
