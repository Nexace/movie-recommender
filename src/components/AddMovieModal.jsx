import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { searchTitles, getDetails, getPosterUrl } from '../api/tmdb';
import { useModal } from '../hooks/useModal';
import RatingPanel from './RatingPanel';

export default function AddMovieModal({ onClose, onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [details, setDetails] = useState(null);
  const [ratings, setRatings] = useState({});
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const requestRef = useRef(0);
  useModal(onClose);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q) => {
    const id = ++requestRef.current;
    if (!q.trim()) { setResults([]); setSearchedQuery(''); setSearching(false); return; }
    setSearching(true);
    const res = await searchTitles(q);
    if (id !== requestRef.current) return;
    setResults(res.slice(0, 10));
    setSearchedQuery(q);
    setSearching(false);
  }, []);

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  }

  async function handleSelect(movie) {
    setSelectedMovie(movie);
    setRatings({});
    const d = await getDetails(movie.id, movie.media_type);
    setDetails(d);
  }

  async function handleSave() {
    if (!selectedMovie) return;
    setSaving(true);
    try {
      const movie = details || selectedMovie;
      const genres = movie.genres?.map((g) => ({ id: g.id, name: g.name })) || [];
      await onAdd({
        id: movie.id,
        media_type: selectedMovie.media_type,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        runtime: movie.runtime,
        original_language: movie.original_language,
        genres,
      }, ratings);
      onClose();
    } catch (err) {
      console.error('Failed to add movie:', err);
    } finally {
      setSaving(false);
    }
  }

  function handleRatingChange(key, value) {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }

  const hasRatings = Object.values(ratings).some((v) => v > 0);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="modal-backdrop"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={selectedMovie ? 'Rate and add movie' : 'Search movies'}
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          margin: 'auto',
          maxWidth: 520,
          width: '100%',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(16px, 4vw, 28px)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {selectedMovie ? 'Rate & Add' : 'Add to Watchlist'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {!selectedMovie ? (
            <>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search movies & TV shows..."
                aria-label="Search movies and TV shows"
                value={query}
                onChange={handleQueryChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(20,20,20,0.8)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  outline: 'none',
                  marginBottom: 16,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-brown)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />

              {searching && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 14 }}>
                  Searching...
                </div>
              )}

              {!searching && results.length === 0 && query.trim() && searchedQuery === query && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 14 }}>
                  No movies found
                </div>
              )}

              {results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'min(400px, 55dvh)', overflowY: 'auto', overflowX: 'hidden', padding: 2, overscrollBehavior: 'contain' }}>
                  {results.map((movie) => (
                    <motion.button
                      key={movie.key}
                      onClick={() => handleSelect(movie)}
                      className="hover-accent-border"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 10,
                        background: 'rgba(20,20,20,0.7)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        flexShrink: 0,
                      }}
                    >
                      {movie.poster_path ? (
                        <img
                          src={getPosterUrl(movie.poster_path, 'w92')}
                          alt={movie.title}
                          loading="lazy"
                          style={{
                            width: 40,
                            height: 60,
                            borderRadius: 6,
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 60, borderRadius: 6, background: 'var(--bg-card)', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {movie.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {movie.release_date?.split('-')[0] || 'N/A'}
                          {movie.media_type === 'tv' ? ' · TV series' : ''}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {!query && !searching && (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 14 }}>
                  Start typing to search for movies
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                {selectedMovie.poster_path ? (
                  <img
                    src={getPosterUrl(selectedMovie.poster_path, 'w154')}
                    alt={selectedMovie.title}
                    loading="lazy"
                    style={{
                      width: 70,
                      height: 105,
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : null}
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {selectedMovie.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {selectedMovie.release_date?.split('-')[0] || ''}
                    {selectedMovie.media_type === 'tv' ? ' · TV series' : ''}
                    {details?.runtime ? ` · ${details.runtime} min${selectedMovie.media_type === 'tv' ? '/ep' : ''}` : ''}
                  </p>
                  {details?.genres && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {details.genres.slice(0, 3).map((g) => (
                        <span
                          key={g.id}
                          style={{
                            background: 'var(--bg-card)',
                            padding: '2px 8px',
                            borderRadius: 100,
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <RatingPanel ratings={ratings} onChange={handleRatingChange} />

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <motion.button
                  onClick={handleSave}
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.45), rgba(210, 180, 140, 0.25) 35%, rgba(255, 245, 235, 0.25) 46%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 245, 235, 0.25) 54%, rgba(210, 180, 140, 0.25) 65%, rgba(184, 134, 74, 0.45))',
                    color: '#f5f0e8',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 15,
                    fontWeight: 700,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Adding...' : hasRatings ? 'Add to Watchlist' : 'Add without Rating'}
                </motion.button>
                <motion.button
                  onClick={() => { setSelectedMovie(null); setDetails(null); setRatings({}); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
