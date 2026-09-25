import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MovieCard from './MovieCard';
import MovieDetail from './MovieDetail';
import AddMovieModal from './AddMovieModal';
import RatingPanel from './RatingPanel';
import { getPosterUrl, itemKey } from '../api/tmdb';
import SkeletonCard from './SkeletonCard';
import { useWatchlistRecs } from '../hooks/useWatchlistRecs';
import { useToast } from './Toast';
import { useModal } from '../hooks/useModal';

const SORT_OPTIONS = [
  { id: 'date-desc', label: 'Recently Added' },
  { id: 'date-asc', label: 'Oldest First' },
  { id: 'title-asc', label: 'A-Z' },
  { id: 'title-desc', label: 'Z-A' },
  { id: 'rating-desc', label: 'Highest Rated' },
  { id: 'rating-asc', label: 'Lowest Rated' },
];

export default function Watchlist({
  watchlistMovies,
  onAddMovie,
  onUpdateRatings,
  onUpdateNotes,
  onRemoveMovie,
}) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRatingsFor, setEditRatingsFor] = useState(null);
  const [editRatings, setEditRatings] = useState({});
  const [editNotes, setEditNotes] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  function handleRandomPick() {
    if (watchlistMovies.length === 0) return;
    const idx = Math.floor(Math.random() * watchlistMovies.length);
    setSelectedMovie(watchlistMovies[idx]);
  }

  const { tagBased, similar, likedGenres, loading: recsLoading } = useWatchlistRecs(watchlistMovies);

  const sortedMovies = useMemo(() => {
    let filtered = watchlistMovies;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) => m.title?.toLowerCase().includes(q));
    }
    const sorted = [...filtered];
    switch (sortBy) {
      case 'date-asc': sorted.sort((a, b) => a.dateAdded - b.dateAdded); break;
      case 'title-asc': sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
      case 'title-desc': sorted.sort((a, b) => (b.title || '').localeCompare(a.title || '')); break;
      case 'rating-desc': sorted.sort((a, b) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0)); break;
      case 'rating-asc': sorted.sort((a, b) => (a.ratings?.overall || 0) - (b.ratings?.overall || 0)); break;
      default: sorted.sort((a, b) => b.dateAdded - a.dateAdded);
    }
    return sorted;
  }, [watchlistMovies, sortBy, search]);

  const ratedCount = watchlistMovies.filter((m) => m.ratings?.overall != null).length;

  function handleAddMovie(movie, ratings) {
    return onAddMovie(movie, ratings);
  }

  function handleEditRatings(movie) {
    setEditRatingsFor(movie);
    setEditRatings(movie.ratings || {});
    setEditNotes(movie.notes || '');
  }

  function handleSaveRatings() {
    if (editRatingsFor) {
      onUpdateRatings(editRatingsFor.id, editRatings);
      if (onUpdateNotes && editNotes !== (editRatingsFor.notes || '')) {
        onUpdateNotes(editRatingsFor.id, editNotes);
      }
      setEditRatingsFor(null);
      setEditRatings({});
      setEditNotes('');
      showToast('Saved!', 'success');
    }
  }

  function handleRatingChange(key, value) {
    setEditRatings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
        <div
          style={{
            minHeight: '100vh',
            padding: '96px 20px 40px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 1200,
              background: 'rgba(10, 10, 10, 0.5)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-xl)',
              padding: 'clamp(24px, 4vw, 40px) clamp(16px, 3vw, 36px)',
              boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 32,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  My Watchlist
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {watchlistMovies.length} {watchlistMovies.length === 1 ? 'movie' : 'movies'}
                  {ratedCount > 0 ? ` · ${ratedCount} rated` : ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <motion.button
                onClick={() => setShowAddModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.45), rgba(210, 180, 140, 0.25) 35%, rgba(255, 245, 235, 0.25) 46%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 245, 235, 0.25) 54%, rgba(210, 180, 140, 0.25) 65%, rgba(184, 134, 74, 0.45))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: '#f5f0e8',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14,
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                }}
              >
                + Add Movie
              </motion.button>
              {watchlistMovies.length > 0 && (
                <motion.button
                  onClick={handleRandomPick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '12px 20px',
                    background: 'transparent',
                    border: '1px solid var(--accent-brown)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--accent-brown)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  aria-label="Pick a random movie"
                >
                  🎲 Random
                </motion.button>
              )}
              </div>
            </div>

            {watchlistMovies.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'center',
                  marginBottom: 32,
                }}
              >
                <input
                  type="text"
                  placeholder="Search your watchlist..."
                  aria-label="Search your watchlist"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(20,20,20,0.8)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    minWidth: 200,
                    flex: '1 1 180px',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-brown)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort movies"
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(20,20,20,0.8)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    cursor: 'pointer',
                    flex: '1 1 130px',
                    minWidth: 0,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-brown)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                <motion.button
                  onClick={() => { setSearch(''); setSortBy('date-desc'); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label="Clear search and reset sort"
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </motion.button>
              </div>
            )}

            {sortedMovies.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 'clamp(12px, 2vw, 20px)',
                }}
              >
                <AnimatePresence>
                  {sortedMovies.map((movie, i) => (
                    <WatchlistItem
                      key={itemKey(movie)}
                      movie={movie}
                      index={i}
                      onClick={setSelectedMovie}
                      onEditRatings={handleEditRatings}
                      onRemove={onRemoveMovie}
                      onShowToast={showToast}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}
                >
                  📋
                </motion.div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {watchlistMovies.length === 0 ? 'Your watchlist is empty' : 'No matches'}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                  {watchlistMovies.length === 0
                    ? 'Add movies from recommendations or search directly'
                    : 'Try adjusting your search'}
                </p>
                {watchlistMovies.length === 0 && (
                  <motion.button
                    onClick={() => setShowAddModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '12px 28px',
                      background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.45), rgba(210, 180, 140, 0.25) 35%, rgba(255, 245, 235, 0.25) 46%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 245, 235, 0.25) 54%, rgba(210, 180, 140, 0.25) 65%, rgba(184, 134, 74, 0.45))',
                    color: '#f5f0e8',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 15,
                    fontWeight: 700,
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                    }}
                  >
                    Add Your First Movie
                  </motion.button>
                )}
              </div>
            )}

            {watchlistMovies.length > 0 && (recsLoading || similar.length > 0 || tagBased.length > 0) && (
              <div style={{ marginTop: 56 }}>
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 40,
                    marginBottom: 24,
                  }}
                >
                  <h2
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    Based on Your Watchlist
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    {ratedCount > 0
                      ? 'Shaped by your ratings. Rate more titles to sharpen these.'
                      : 'Rate a few titles to make these more personal.'}
                  </p>
                </div>

                {recsLoading && similar.length === 0 && tagBased.length === 0 ? (
                  <SkeletonCard count={6} />
                ) : (
                  <>
                    {similar.length > 0 && (
                      <div style={{ marginBottom: tagBased.length > 0 ? 40 : 0 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
                          Recommended from your favourites
                        </h3>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: 'clamp(12px, 2vw, 20px)',
                          }}
                        >
                          {similar.map((movie, i) => (
                            <MovieCard
                              key={movie.key}
                              movie={movie}
                              index={i}
                              onClick={setSelectedMovie}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {tagBased.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
                          {likedGenres.length > 0 ? `Top rated in ${likedGenres.join(' & ')}` : 'Top rated in your favourite genres'}
                        </h3>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: 'clamp(12px, 2vw, 20px)',
                          }}
                        >
                          {tagBased.slice(0, 6).map((movie, i) => (
                            <MovieCard
                              key={movie.key}
                              movie={movie}
                              index={i}
                              onClick={setSelectedMovie}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <AnimatePresence>
              {selectedMovie && (
                <MovieDetail
                  movie={selectedMovie}
                  watchlistMovies={watchlistMovies}
                  onClose={() => setSelectedMovie(null)}
                  onAddToWatchlist={async (movie) => {
                    await handleAddMovie(movie, {});
                  }}
                  onEditRatings={handleEditRatings}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showAddModal && (
                <AddMovieModal
                  onClose={() => setShowAddModal(false)}
                  onAdd={handleAddMovie}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {editRatingsFor && (
                <EditRatingsModal
                  movie={editRatingsFor}
                  ratings={editRatings}
                  notes={editNotes}
                  onRatingChange={handleRatingChange}
                  onNotesChange={setEditNotes}
                  onSave={handleSaveRatings}
                  onClose={() => setEditRatingsFor(null)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
    </motion.div>
  );
}

function WatchlistItem({ movie, index, onClick, onEditRatings, onRemove, onShowToast }) {
  const posterUrl = getPosterUrl(movie.poster_path);
  const year = movie.release_date?.split('-')[0] || '';
  const hasRatings = movie.ratings && Object.values(movie.ratings).some((v) => v > 0);
  const overallRating = movie.ratings?.overall;
  const avgRating = hasRatings
    ? Object.entries(movie.ratings)
        .filter(([, v]) => v > 0)
        .reduce((s, [, v]) => s + v, 0) /
      Object.entries(movie.ratings).filter(([, v]) => v > 0).length
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      layout
    >
      <div
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        <div
          onClick={() => onClick(movie)}
          style={{
            cursor: 'pointer',
            position: 'relative',
            width: '100%',
            aspectRatio: '2/3',
            overflow: 'hidden',
            background: 'var(--bg-secondary)',
          }}
        >
          {posterUrl ? (
            <motion.img
              src={posterUrl}
              alt={movie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
                padding: 20,
                textAlign: 'center',
              }}
            >
              No poster
            </div>
          )}

          {overallRating != null && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>★</span>
              {overallRating}
            </div>
          )}
        </div>

        <div style={{ padding: '10px 12px 12px' }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {movie.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            {year && <span>{year}</span>}
            {hasRatings && avgRating && (
              <span style={{ color: 'var(--accent-brown)', fontWeight: 600 }}>
                {avgRating.toFixed(1)}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            <motion.button
              onClick={(e) => { e.stopPropagation(); onEditRatings(movie); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={hasRatings ? `Edit rating for ${movie.title}` : `Rate ${movie.title}`}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'rgba(139, 107, 74, 0.12)',
                border: '1px solid rgba(139, 107, 74, 0.2)',
                borderRadius: 6,
                color: 'var(--accent-brown)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {hasRatings ? 'Edit' : 'Rate'}
            </motion.button>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                const title = movie.title;
                onRemove(movie.id);
                if (onShowToast) onShowToast(`${title} removed`, 'info');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Remove ${movie.title} from watchlist`}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-muted)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ✕
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EditRatingsModal({ movie, ratings, notes, onRatingChange, onNotesChange, onSave, onClose }) {
  useModal(onClose);
  const thumb = getPosterUrl(movie.poster_path, 'w92');

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
        aria-label={`Rate ${movie.title}`}
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          margin: 'auto',
          maxWidth: 440,
          width: '100%',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(20px, 3vw, 28px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          {thumb && (
            <img
              src={thumb}
              alt={movie.title}
              style={{ width: 46, height: 69, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              {movie.title}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Rate your experience
            </p>
          </div>
        </div>

        <RatingPanel ratings={ratings} onChange={onRatingChange} />

        <div style={{ marginTop: 20 }}>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Your notes on this movie..."
            aria-label="Your notes on this movie"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(20,20,20,0.8)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 13,
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-brown)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <motion.button
            onClick={onSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.45), rgba(210, 180, 140, 0.25) 35%, rgba(255, 245, 235, 0.25) 46%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 245, 235, 0.25) 54%, rgba(210, 180, 140, 0.25) 65%, rgba(184, 134, 74, 0.45))',
              color: '#f5f0e8',
              borderRadius: 'var(--radius-md)',
              fontSize: 15,
              fontWeight: 600,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
            }}
          >
            Save Ratings
          </motion.button>
          <motion.button
            onClick={onClose}
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
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
