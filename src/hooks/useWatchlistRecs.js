import { useState, useEffect, useRef } from 'react';
import {
  discover, getDetails, interleave, itemKey, toMovieGenres, toTvGenres, MOVIE_GENRES,
} from '../api/tmdb';
import { qualityScore } from '../utils/scoreMatch';

// What a watchlist entry says about taste: ratings above 5.5 pull toward it, lower ratings
// push away, and an unrated save is mild interest.
function tasteWeight(m) {
  const r = m.ratings?.overall;
  return r ? (r - 5.5) / 4.5 : 0.3;
}

function genreIdsOf(m) {
  const ids = (m.genres || []).map((g) => (typeof g === 'object' ? g.id : g));
  return toMovieGenres(ids, m.media_type);
}

async function buildRecs(watchlist) {
  const owned = new Set(watchlist.map(itemKey));

  const genreWeights = new Map();
  for (const m of watchlist) {
    for (const g of genreIdsOf(m)) genreWeights.set(g, (genreWeights.get(g) || 0) + tasteWeight(m));
  }
  const liked = [...genreWeights].filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
  const disliked = new Set([...genreWeights].filter(([, w]) => w <= -0.8).map(([g]) => g));

  // Titles TMDB recommends for your favourites; ones several favourites agree on rank highest.
  const favourites = watchlist
    .filter((m) => tasteWeight(m) > 0)
    .sort((a, b) => tasteWeight(b) - tasteWeight(a))
    .slice(0, 8);
  const details = await Promise.all(favourites.map((m) => getDetails(m.id, m.media_type)));
  const votes = new Map();
  details.forEach((d, i) => {
    for (const r of d?.recommendations || []) {
      if (owned.has(r.key)) continue;
      const v = votes.get(r.key) || { item: r, score: 0 };
      v.score += tasteWeight(favourites[i]);
      votes.set(r.key, v);
    }
  });
  const similar = [...votes.values()]
    .filter(({ item }) => !toMovieGenres(item.genre_ids, item.media_type).some((g) => disliked.has(g)))
    .map(({ item, score }) => ({ ...item, rankScore: score * 10 + qualityScore(item) / 10 }))
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 12);

  // Highly rated titles in your favourite genres, avoiding genres you rated poorly.
  let tagBased = [];
  if (liked.length > 0) {
    const avoid = disliked.size > 0 ? { without_genres: [...disliked].join(',') } : {};
    const pair = liked.slice(0, 2);
    const lists = await Promise.all([
      discover('movie', { ...avoid, with_genres: pair.join(','), sort_by: 'popularity.desc', 'vote_count.gte': 300 }),
      ...pair.map((g) => discover('movie', { ...avoid, with_genres: g, sort_by: 'vote_average.desc', 'vote_count.gte': 1000 })),
      watchlist.some((m) => m.media_type === 'tv')
        ? discover('tv', { with_genres: toTvGenres(pair).join('|'), sort_by: 'vote_average.desc', 'vote_count.gte': 300 })
        : [],
    ]);
    const shown = new Set(similar.map((s) => s.key));
    tagBased = interleave(lists).filter((m) => !owned.has(m.key) && !shown.has(m.key)).slice(0, 12);
  }

  return { similar, tagBased, likedGenres: liked.slice(0, 2).map((g) => MOVIE_GENRES[g]).filter(Boolean) };
}

// Recommendations from the watchlist, refreshed whenever titles or ratings change.
export function useWatchlistRecs(watchlistMovies) {
  const [recs, setRecs] = useState({ similar: [], tagBased: [], likedGenres: [] });
  const [loading, setLoading] = useState(false);
  const latest = useRef(watchlistMovies);
  latest.current = watchlistMovies;

  const signature = watchlistMovies.map((m) => `${itemKey(m)}=${m.ratings?.overall ?? ''}`).join('|');

  useEffect(() => {
    if (!signature) {
      setRecs({ similar: [], tagBased: [], likedGenres: [] });
      setLoading(false);
      return;
    }
    let cancelled = false;
    // Wait for a pause so rating several titles in a row triggers one refresh.
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const next = await buildRecs(latest.current);
        if (!cancelled) setRecs(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [signature]);

  return { ...recs, loading };
}
