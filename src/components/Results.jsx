import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import MovieCard from './MovieCard';
import MovieDetail from './MovieDetail';
import SkeletonCard from './SkeletonCard';
import { GENRE_MAP } from '../data/answerMappings';
import { toMovieGenres, MOVIE_GENRES } from '../api/tmdb';

const GENRE_IDS = Object.entries(GENRE_MAP);
const SORT_OPTIONS = [
  { id: 'default', label: 'Best match' },
  { id: 'rating-desc', label: 'Highest Rated' },
  { id: 'rating-asc', label: 'Lowest Rated' },
  { id: 'year-desc', label: 'Newest' },
  { id: 'year-asc', label: 'Oldest' },
];

function filterAndSortMovies(movies, search, genreFilter, sortBy) {
  let filtered = movies;

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.title?.toLowerCase().includes(q) ||
        m.overview?.toLowerCase().includes(q) ||
        m.release_date?.includes(q)
    );
  }

  if (genreFilter) {
    const genreId = GENRE_MAP[genreFilter];
    if (genreId) {
      filtered = filtered.filter((m) => toMovieGenres(m.genre_ids || [], m.media_type).includes(genreId));
    }
  }

  if (sortBy === 'rating-desc') {
    filtered = [...filtered].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  } else if (sortBy === 'rating-asc') {
    filtered = [...filtered].sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
  } else if (sortBy === 'year-desc') {
    filtered = [...filtered].sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
  } else if (sortBy === 'year-asc') {
    filtered = [...filtered].sort((a, b) => new Date(a.release_date || 0) - new Date(b.release_date || 0));
  }
  // 'default' keeps the recommender's order, which already blends match and quality.

  return filtered;
}

export default function Results({ primaryMovies, secondaryMovies, loading, error, onReset, watchlistMovies, onAddToWatchlist }) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showAllSecondary, setShowAllSecondary] = useState(false);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const filteredPrimary = useMemo(() => filterAndSortMovies(primaryMovies, search, genreFilter, sortBy), [primaryMovies, search, genreFilter, sortBy]);
  const filteredSecondary = useMemo(() => filterAndSortMovies(secondaryMovies, search, genreFilter, sortBy), [secondaryMovies, search, genreFilter, sortBy]);

  const displayPrimary = useMemo(() => {
    if (showAll) return filteredPrimary;
    return filteredPrimary.slice(0, 12);
  }, [filteredPrimary, showAll]);

  const displaySecondary = useMemo(() => {
    if (showAllSecondary) return filteredSecondary;
    return filteredSecondary.slice(0, 12);
  }, [filteredSecondary, showAllSecondary]);

  const hasSecondary = filteredSecondary.length > 0;
  const allMovies = useMemo(() => [...primaryMovies, ...secondaryMovies], [primaryMovies, secondaryMovies]);

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.2 } }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '96px 20px 40px',
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
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                textAlign: 'center',
                marginBottom: 40,
              }}
            >
              <motion.h1
                className="gradient-text"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontWeight: 900,
                  marginBottom: 12,
                }}
              >
                Your Picks
              </motion.h1>
              <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 16,
                    fontWeight: 300,
                    marginBottom: 24,
                  }}
                >
                  {allMovies.length > 0
                    ? `We found ${allMovies.length} titles for you`
                    : 'Curated just for your vibe'}
                </p>
                {!loading && !error && allMovies.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 32,
                        width: '100%',
                      }}
                  >
                    <input
                      type="text"
                      placeholder="Search by title, genre, year..."
                      aria-label="Filter results"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(20,20,20,0.8)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        minWidth: 0,
                        flex: '1 1 220px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-brown)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    />
                    <select
                      aria-label="Filter by genre"
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(20,20,20,0.8)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                        flex: '1 1 130px',
                        minWidth: 0,
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-brown)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <option value="">All Genres</option>
                      {GENRE_IDS.map(([id]) => (
                        <option key={id} value={id}>
                          {MOVIE_GENRES[GENRE_MAP[id]]}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Sort results"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(20,20,20,0.8)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
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
                      onClick={() => { setSearch(''); setGenreFilter(''); setSortBy('default'); }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
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
                    <motion.button
                      onClick={onReset}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      ← Start Over
                    </motion.button>
                  </div>
                )}
            </motion.div>

            {!loading && !error && !user && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{
                  marginBottom: 24,
                  background: 'rgba(184,134,74,0.08)',
                  border: '1px solid rgba(184,134,74,0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400 }}>
                  Sign in to save these picks to your watchlist
                </p>
                <motion.button
                  onClick={() => setShowAuth(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '7px 16px',
                    background: 'linear-gradient(135deg, rgba(184,134,74,0.4), rgba(210,180,140,0.2) 35%, rgba(255,245,235,0.2) 46%, rgba(255,255,255,0.3) 50%, rgba(255,245,235,0.2) 54%, rgba(210,180,140,0.2) 65%, rgba(184,134,74,0.4))',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-md)',
                    color: '#f5f0e8', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Sign In
                </motion.button>
              </motion.div>
            )}

            {loading ? (
              <SkeletonCard count={12} />
            ) : error ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 60,
                  color: 'var(--text-secondary)',
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  style={{ fontSize: 48, marginBottom: 16 }}
                >
                  🎬
                </motion.div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                  }}
                >
                  Oops! Something went wrong
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                  {error}
                </p>
                <motion.button
                  onClick={onReset}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.45), rgba(210, 180, 140, 0.25) 35%, rgba(255, 245, 235, 0.25) 46%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 245, 235, 0.25) 54%, rgba(210, 180, 140, 0.25) 65%, rgba(184, 134, 74, 0.45))',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#f5f0e8',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 15,
                    fontWeight: 700,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                  }}
                >
                  Try Again
                </motion.button>
              </div>
            ) : (
              <>
                {filteredPrimary.length > 0 && (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: 'clamp(12px, 2vw, 20px)',
                      }}
                    >
                      <AnimatePresence>
                        {displayPrimary.map((movie, i) => (
                          <MovieCard
                            key={movie.key}
                            movie={movie}
                            index={i}
                            onClick={setSelectedMovie}
                            matchScore={movie.match}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    {filteredPrimary.length > 12 && !showAll && (
                      <div style={{ textAlign: 'center', marginTop: 32, padding: '0 16px' }}>
                        <motion.button
                          onClick={() => setShowAll(true)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            padding: '12px 32px',
                            background: 'transparent',
                            border: '1px solid var(--accent-brown)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--accent-brown)',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Show All {filteredPrimary.length}
                        </motion.button>
                      </div>
                    )}
                  </>
                )}

                {hasSecondary && filteredSecondary.length > 0 && (
                  <div style={{ marginTop: filteredPrimary.length > 0 ? 56 : 0 }}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
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
                        More Picks for You
                      </h2>
                      <p
                        style={{
                          fontSize: 14,
                          color: 'var(--text-muted)',
                          fontWeight: 400,
                        }}
                      >
                        Good fits that just missed the top list
                      </p>
                    </motion.div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: 'clamp(12px, 2vw, 20px)',
                      }}
                    >
                      <AnimatePresence>
                        {displaySecondary.map((movie, i) => (
                          <MovieCard
                            key={movie.key}
                            movie={movie}
                            index={i}
                            onClick={setSelectedMovie}
                            matchScore={movie.match}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    {filteredSecondary.length > 12 && !showAllSecondary && (
                      <div style={{ textAlign: 'center', marginTop: 32, padding: '0 16px' }}>
                        <motion.button
                          onClick={() => setShowAllSecondary(true)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            padding: '12px 32px',
                            background: 'transparent',
                            border: '1px solid var(--accent-brown)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--accent-brown)',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Show All {filteredSecondary.length}
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}

                {filteredPrimary.length === 0 && !hasSecondary && !loading && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 60,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      style={{ fontSize: 48, marginBottom: 16 }}
                    >
                      🎥
                    </motion.div>
                    <h3
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 8,
                      }}
                    >
                      {primaryMovies.length > 0 ? 'No matches' : 'No movies found'}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                      {primaryMovies.length > 0
                        ? 'Try adjusting your search or filters'
                        : 'Try different preferences and search again'}
                    </p>
                    <motion.button
                      onClick={primaryMovies.length > 0 ? () => { setSearch(''); setGenreFilter(''); setSortBy('default'); } : onReset}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: '12px 28px',
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
                      {primaryMovies.length > 0 ? 'Clear Filters' : 'Try Again'}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    </motion.div>

    <AnimatePresence>
      {selectedMovie && (
        <MovieDetail
          key="detail"
          movie={selectedMovie}
          watchlistMovies={watchlistMovies}
          onClose={() => setSelectedMovie(null)}
          onAddToWatchlist={onAddToWatchlist}
        />
      )}
      {showAuth && <AuthModal key="auth" onClose={() => setShowAuth(false)} />}
    </AnimatePresence>
    </>
  );
}
