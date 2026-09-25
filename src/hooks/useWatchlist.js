import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllMovies,
  addMovie as dbAdd,
  updateMovieRatings as dbUpdateRatings,
  updateMovie as dbUpdate,
  removeMovie as dbRemove,
  isInWatchlist as dbCheck,
  getMovie as dbGet,
} from '../api/db';
import {
  fetchWatchlist,
  addMovieToSupabase,
  updateMovieRatingsInSupabase,
  updateMovieNotesInSupabase,
  removeMovieFromSupabase,
} from '../api/supabaseWatchlist';

export function useWatchlist() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const online = !!supabase && !!user;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (online) {
        const all = await fetchWatchlist(user.id);
        setMovies(all);
      } else {
        const all = await getAllMovies();
        setMovies(all);
      }
    } finally {
      setLoading(false);
    }
  }, [online, user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addMovie = useCallback(async (movie, ratings) => {
    const movieWithRatings = ratings ? { ...movie, ratings } : movie;
    if (online) {
      const entry = await addMovieToSupabase(user.id, movieWithRatings);
      setMovies((prev) => [entry, ...prev]);
      return entry;
    } else {
      const entry = await dbAdd(movieWithRatings);
      setMovies((prev) => [entry, ...prev]);
      return entry;
    }
  }, [online, user]);

  const updateRatings = useCallback(async (id, ratings) => {
    if (online) {
      await updateMovieRatingsInSupabase(user.id, id, ratings);
      setMovies((prev) => prev.map((m) => (m.id === id ? { ...m, ratings } : m)));
    } else {
      const updated = await dbUpdateRatings(id, ratings);
      setMovies((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
  }, [online, user]);

  const updateNotes = useCallback(async (id, notes) => {
    if (online) {
      await updateMovieNotesInSupabase(user.id, id, notes);
      setMovies((prev) => prev.map((m) => (m.id === id ? { ...m, notes } : m)));
    } else {
      const updated = await dbUpdate(id, { notes });
      setMovies((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
  }, [online, user]);

  const removeMovie = useCallback(async (id) => {
    if (online) {
      await removeMovieFromSupabase(user.id, id);
    } else {
      await dbRemove(id);
    }
    setMovies((prev) => prev.filter((m) => m.id !== id));
  }, [online, user]);

  const isInWatchlist = useCallback(async (id) => {
    if (movies.some((m) => m.id === id)) return true;
    if (online) {
      const all = await fetchWatchlist(user.id);
      return all.some((m) => m.id === id);
    }
    return dbCheck(id);
  }, [movies, online, user]);

  const getMovie = useCallback(async (id) => {
    const local = movies.find((m) => m.id === id);
    if (local) return local;
    if (online) {
      const all = await fetchWatchlist(user.id);
      return all.find((m) => m.id === id) || null;
    }
    return dbGet(id);
  }, [movies, online, user]);

  return { movies, loading, refresh, addMovie, updateRatings, updateNotes, removeMovie, isInWatchlist, getMovie };
}
