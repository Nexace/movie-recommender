import { supabase } from './supabase';
import { getAllMovies } from './db';

// The watchlist table predates TV support; only TV rows carry media_type, so movie saves keep
// working even before the column exists (see README for the one-line migration).
const mediaTypeColumn = (movie) => (movie.media_type === 'tv' ? { media_type: 'tv' } : {});

export async function fetchWatchlist(userId) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('date_added', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addMovieToSupabase(userId, movie) {
  try {
    const { data, error } = await supabase
      .from('watchlist')
      .upsert({
        user_id: userId,
        id: movie.id,
        ...mediaTypeColumn(movie),
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        runtime: movie.runtime,
        original_language: movie.original_language,
        genres: movie.genres || [],
        ratings: movie.ratings || { plot: null, cinematography: null, soundtrack: null, overall: null },
        notes: movie.notes || '',
        date_added: movie.date_added || movie.dateAdded || Date.now(),
      })
      .select()
      .single();
    if (error) {
      console.warn('Supabase error after upsert (data was likely written):', error.message);
    } else if (data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase .select() after upsert failed (data was likely written):', err.message);
  }
  return { ...movie, user_id: userId, date_added: movie.date_added || movie.dateAdded || Date.now() };
}

export async function updateMovieRatingsInSupabase(userId, movieId, ratings) {
  const { error } = await supabase
    .from('watchlist')
    .update({ ratings })
    .eq('user_id', userId)
    .eq('id', movieId);
  if (error) throw error;
}

export async function updateMovieNotesInSupabase(userId, movieId, notes) {
  const { error } = await supabase
    .from('watchlist')
    .update({ notes })
    .eq('user_id', userId)
    .eq('id', movieId);
  if (error) throw error;
}

export async function removeMovieFromSupabase(userId, movieId) {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('id', movieId);
  if (error) throw error;
}

export async function migrateWatchlist(userId) {
  try {
    const localMovies = await getAllMovies();
    if (localMovies.length === 0) return;

    const { data: existing } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', userId);
    const existingIds = new Set((existing || []).map((m) => m.id));

    const toUpload = localMovies.filter((m) => !existingIds.has(m.id));
    if (toUpload.length === 0) return;

    const rows = toUpload.map((movie) => ({
      user_id: userId,
      id: movie.id,
      ...mediaTypeColumn(movie),
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      overview: movie.overview,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      runtime: movie.runtime,
      original_language: movie.original_language,
      genres: movie.genres || [],
      ratings: movie.ratings || { plot: null, cinematography: null, soundtrack: null, overall: null },
      notes: movie.notes || '',
      date_added: movie.dateAdded || Date.now(),
    }));

    const { error } = await supabase.from('watchlist').upsert(rows);
    if (error) console.error('Migration error:', error);
  } catch (err) {
    console.error('Migration failed:', err);
  }
}
