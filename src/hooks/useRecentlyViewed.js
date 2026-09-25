import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'cinematch_recently_viewed';
const MAX_ITEMS = 10;

export function loadRecentlyViewed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState(loadRecentlyViewed);

  useEffect(() => {
    saveToStorage(recentlyViewed);
  }, [recentlyViewed]);

  const addToRecentlyViewed = useCallback((movie) => {
    setRecentlyViewed((prev) => {
      const type = movie.media_type === 'tv' ? 'tv' : 'movie';
      const filtered = prev.filter((m) => !(m.id === movie.id && (m.media_type || 'movie') === type));
      const entry = {
        id: movie.id,
        media_type: type,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        overview: movie.overview,
      };
      const updated = [entry, ...filtered];
      return updated.slice(0, MAX_ITEMS);
    });
  }, []);

  return { recentlyViewed, addToRecentlyViewed };
}
