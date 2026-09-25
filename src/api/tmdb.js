const BASE_URL = 'https://api.themoviedb.org/3';

function getApiKey() {
  return import.meta.env.VITE_TMDB_API_KEY;
}

// TMDB uses different genre ids for movies and TV. Recommendations and scoring work in
// movie-genre terms and translate at the edges.
export const MOVIE_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

export const TV_GENRES = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids', 9648: 'Mystery',
  10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics', 37: 'Western',
};

// Movie genre -> the TV genres that cover it (TV has no Horror, Romance or Thriller).
const MOVIE_TO_TV = {
  28: [10759], 12: [10759], 14: [10765], 878: [10765], 53: [9648, 80],
  27: [9648, 10765], 10749: [18], 36: [10768], 10752: [10768], 10402: [], 10770: [],
};

// TV genre -> the movie genres it stands for.
const TV_TO_MOVIE = { 10759: [28, 12], 10765: [878, 14], 10768: [10752, 36], 10762: [10751, 16] };

export function toTvGenres(movieGenreIds) {
  const ids = movieGenreIds.flatMap((id) => MOVIE_TO_TV[id] ?? [id]);
  return [...new Set(ids)].filter((id) => TV_GENRES[id]);
}

// An item's genres expressed as movie genre ids, whatever its media type.
export function toMovieGenres(genreIds, mediaType) {
  if (mediaType !== 'tv') return genreIds;
  return [...new Set(genreIds.flatMap((id) => TV_TO_MOVIE[id] ?? [id]))];
}

// Time zones of common audiences -> country. Many people keep an en-US browser locale,
// so the time zone is the better hint.
const TIMEZONE_REGIONS = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Europe/London': 'GB', 'Europe/Dublin': 'IE',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Phoenix': 'US',
  'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
  'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX', 'Asia/Singapore': 'SG', 'Asia/Dubai': 'AE',
  'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP',
  'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Africa/Lagos': 'NG', 'Africa/Johannesburg': 'ZA',
};

// Two-letter country for release dates, "popular near you" and where-to-watch:
// from the time zone when it's a known one, else the browser locale (en-IN -> IN).
export function getRegion() {
  try {
    const fromZone = TIMEZONE_REGIONS[Intl.DateTimeFormat().resolvedOptions().timeZone];
    if (fromZone) return fromZone;
  } catch {
    // Fall through to the locale.
  }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of langs) {
    const match = /-([a-z]{2})\b/i.exec(lang || '');
    if (match) return match[1].toUpperCase();
  }
  return 'US';
}

export function regionName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
  } catch {
    return code;
  }
}

// GET a TMDB endpoint. Retries once on network errors, rate limits and server errors.
async function tmdb(path, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDB API key not found. Add VITE_TMDB_API_KEY to your .env.local file.');
  const url = `${BASE_URL}${path}?${new URLSearchParams({ api_key: apiKey, language: 'en-US', ...params })}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
      if (res.status !== 429 && res.status < 500) return null;
    } catch (err) {
      if (attempt === 1) throw err;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

// Movies and TV shows in one shape: `title`, `release_date`, `media_type` and a unique `key`
// (movie and TV ids overlap, so `id` alone is not unique).
export function normalize(item, mediaType = item.media_type) {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  return {
    ...item,
    media_type: type,
    key: `${type}:${item.id}`,
    title: item.title ?? item.name ?? '',
    release_date: item.release_date || item.first_air_date || '',
    genre_ids: item.genre_ids ?? item.genres?.map((g) => g.id) ?? [],
  };
}

export function itemKey(item) {
  return `${item.media_type === 'tv' ? 'tv' : 'movie'}:${item.id}`;
}

export async function discover(mediaType, params, page = 1) {
  try {
    const data = await tmdb(`/discover/${mediaType}`, { include_adult: false, ...params, page });
    return (data?.results || []).map((r) => normalize(r, mediaType));
  } catch {
    return [];
  }
}

async function list(path, params = {}, mediaType) {
  try {
    const data = await tmdb(path, params);
    return (data?.results || [])
      .filter((r) => mediaType || r.media_type === 'movie' || r.media_type === 'tv')
      .map((r) => normalize(r, mediaType || r.media_type));
  } catch {
    return [];
  }
}

// Round-robin merge of several lists, dropping duplicates.
export function interleave(lists) {
  const seen = new Set();
  const out = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const l of lists) {
      const item = l[i];
      if (item && !seen.has(item.key)) {
        seen.add(item.key);
        out.push(item);
      }
    }
  }
  return out;
}

const today = () => new Date().toISOString().slice(0, 10);

// Browse sections for the Search page. Each returns normalized movies and/or TV shows.
export const catalog = {
  trending: () => list('/trending/all/week'),
  trendingTv: () => list('/trending/tv/week', {}, 'tv'),
  nowPlaying: () => list('/movie/now_playing', { region: getRegion() }, 'movie'),
  upcoming: async () => {
    const items = await list('/movie/upcoming', { region: getRegion() }, 'movie');
    return items.filter((m) => m.release_date >= today());
  },
  popularNearYou: async () => {
    const params = { with_origin_country: getRegion(), sort_by: 'popularity.desc' };
    const [movies, tv] = await Promise.all([
      discover('movie', { ...params, 'vote_count.gte': 20 }),
      discover('tv', { ...params, 'vote_count.gte': 10 }),
    ]);
    return interleave([movies, tv]);
  },
  bestThisYear: async () => {
    const year = new Date().getFullYear();
    const params = { sort_by: 'vote_average.desc', 'vote_count.gte': 100 };
    const [movies, tv] = await Promise.all([
      discover('movie', { ...params, primary_release_year: year }),
      discover('tv', { ...params, first_air_date_year: year, 'vote_count.gte': 50 }),
    ]);
    return interleave([movies, tv]);
  },
  topMovies: () => list('/movie/top_rated', {}, 'movie'),
  topTv: () => list('/tv/top_rated', {}, 'tv'),
  byGenre: async (movieGenreId) => {
    const tvGenres = toTvGenres([movieGenreId]);
    const base = { sort_by: 'popularity.desc', 'vote_count.gte': 200 };
    const [movies, movies2, tv] = await Promise.all([
      discover('movie', { ...base, with_genres: movieGenreId }),
      discover('movie', { ...base, with_genres: movieGenreId }, 2),
      tvGenres.length ? discover('tv', { ...base, with_genres: tvGenres.join('|'), 'vote_count.gte': 100 }) : [],
    ]);
    return interleave([[...movies, ...movies2], tv]);
  },
};

const detailsCache = new Map();

// Full details for a movie or TV show, including cast, trailer, IMDb id and "more like this".
export function getDetails(id, mediaType = 'movie') {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const key = `${type}:${id}`;
  if (!detailsCache.has(key)) {
    const request = tmdb(`/${type}/${id}`, { append_to_response: 'credits,videos,external_ids,recommendations' })
      .then((d) => d && {
        ...normalize(d, type),
        runtime: d.runtime ?? d.episode_run_time?.[0] ?? null,
        recommendations: (d.recommendations?.results || [])
          .filter((r) => r.poster_path)
          .map((r) => normalize(r, r.media_type || type)),
      })
      .catch(() => {
        detailsCache.delete(key);
        return null;
      });
    detailsCache.set(key, request);
  }
  return detailsCache.get(key);
}

const runtimeCache = new Map();

// Just a movie's runtime in minutes (a much smaller request than full details).
export function getRuntime(id) {
  if (!runtimeCache.has(id)) {
    runtimeCache.set(id, tmdb(`/movie/${id}`).then((d) => d?.runtime || null).catch(() => {
      runtimeCache.delete(id);
      return null;
    }));
  }
  return runtimeCache.get(id);
}

export async function fetchExternalRatings(imdbId) {
  const omdbKey = import.meta.env.VITE_OMDB_API_KEY;
  if (!omdbKey || !imdbId) return null;

  try {
    const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === 'False') return null;

    const ratings = {};
    if (data.imdbRating && data.imdbRating !== 'N/A') {
      ratings.imdb = data.imdbRating;
    }
    if (data.Ratings) {
      const rt = data.Ratings.find((r) => r.Source === 'Rotten Tomatoes');
      if (rt) ratings.rottenTomatoes = rt.Value;
      const mc = data.Ratings.find((r) => r.Source === 'Metacritic');
      if (mc) ratings.metacritic = mc.Value;
    }
    return ratings;
  } catch {
    return null;
  }
}

// Search movies and TV shows together.
export async function searchTitles(query) {
  const items = await list('/search/multi', { query, include_adult: false });
  return items.filter((m) => m.poster_path || m.overview);
}

// Every card asks for providers, so share one request per title.
const providersCache = new Map();

export function getWatchProviders(id, mediaType = 'movie') {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const key = `${type}:${id}`;
  if (!providersCache.has(key)) {
    const request = tmdb(`/${type}/${id}/watch/providers`)
      .then((data) => data?.results || null)
      .catch(() => {
        providersCache.delete(key);
        return null;
      });
    providersCache.set(key, request);
  }
  return providersCache.get(key);
}

export function getPosterUrl(path, size = 'w500') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
