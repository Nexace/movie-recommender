import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchTitles, getPosterUrl, catalog, getRegion, regionName, normalize } from '../api/tmdb';
import { useAuth } from '../contexts/AuthContext';
import { loadRecentlyViewed } from '../hooks/useRecentlyViewed';
import AuthModal from './AuthModal';
import MovieDetail from './MovieDetail';
import SkeletonCard from './SkeletonCard';

const REGION = getRegion();
const YEAR = new Date().getFullYear();

// Browse rows, top to bottom.
const SECTIONS = [
  { id: 'trending', title: 'Trending this week', load: catalog.trending },
  ...(REGION !== 'US' ? [{ id: 'nearYou', title: `Popular in ${regionName(REGION)}`, load: catalog.popularNearYou }] : []),
  { id: 'nowPlaying', title: 'Now in cinemas', load: catalog.nowPlaying },
  { id: 'trendingTv', title: 'Trending TV shows', load: catalog.trendingTv },
  { id: 'upcoming', title: 'Coming soon', load: catalog.upcoming },
  { id: 'bestThisYear', title: `Best of ${YEAR}`, load: catalog.bestThisYear },
  { id: 'topMovies', title: 'All-time top rated movies', load: catalog.topMovies },
  { id: 'topTv', title: 'All-time top rated TV', load: catalog.topTv },
];

const GENRES = [
  [28, 'Action'], [35, 'Comedy'], [18, 'Drama'], [53, 'Thriller'], [27, 'Horror'],
  [878, 'Sci-Fi'], [10749, 'Romance'], [16, 'Animation'], [80, 'Crime'], [9648, 'Mystery'],
  [12, 'Adventure'], [14, 'Fantasy'], [10751, 'Family'], [99, 'Documentary'],
];

// Survive navigating away and back within the session.
const sectionCache = {};
const genreCache = {};

const readRecent = () => loadRecentlyViewed().map((m) => normalize(m));

function MovieCard({ movie, index, onClick }) {
  const posterUrl = getPosterUrl(movie.poster_path, 'w342');
  const year = movie.release_date?.split('-')[0] || '';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index || 0, 12) * 0.03, duration: 0.35 } }}
      whileHover={{ y: -6 }}
      onClick={() => onClick?.(movie)}
      style={{
        cursor: 'pointer',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        transition: 'border-color 0.3s',
        scrollSnapAlign: 'start',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 16, textAlign: 'center' }}>
            No poster
          </div>
        )}
        {movie.media_type === 'tv' && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            padding: '2px 7px', borderRadius: 5,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.5px', color: 'var(--text-primary)',
          }}>
            TV
          </div>
        )}
        {rating && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            padding: '3px 8px', borderRadius: 6,
            fontSize: 12, fontWeight: 700, color: 'var(--accent-gold)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            ★ {rating}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <h3 style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.3, marginBottom: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {movie.title}
        </h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{year || ' '}</span>
      </div>
    </motion.div>
  );
}

const sectionTitleStyle = { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 };

// A horizontally scrolling row of titles.
function Row({ title, items, onSelect }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <div
        className="h-scroll"
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'clamp(128px, 30vw, 160px)',
          gap: 'clamp(10px, 2vw, 16px)',
          overflowX: 'auto',
          overscrollBehaviorX: 'contain',
          scrollSnapType: 'x proximity',
          paddingBottom: 10,
        }}
      >
        {items.map((movie, i) => (
          <MovieCard key={movie.key} movie={movie} index={i} onClick={onSelect} />
        ))}
      </div>
    </motion.section>
  );
}

function Grid({ title, items, onSelect }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
      {title && <h2 style={sectionTitleStyle}>{title}</h2>}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 'clamp(12px, 2vw, 20px)',
      }}>
        {items.map((movie, i) => (
          <MovieCard key={movie.key} movie={movie} index={i} onClick={onSelect} />
        ))}
      </div>
    </motion.div>
  );
}

export default function SearchMovies({ watchlistMovies, onAddToWatchlist }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [sections, setSections] = useState(() => ({ ...sectionCache }));
  const [genre, setGenre] = useState(null);
  const [genreItems, setGenreItems] = useState(null);
  const [recent, setRecent] = useState(readRecent);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    for (const section of SECTIONS) {
      if (sectionCache[section.id]) continue;
      section.load().then((items) => {
        const withPosters = items.filter((m) => m.poster_path).slice(0, 20);
        sectionCache[section.id] = withPosters;
        if (!cancelled) setSections((prev) => ({ ...prev, [section.id]: withPosters }));
      });
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!genre) return;
    if (genreCache[genre]) {
      setGenreItems(genreCache[genre]);
      return;
    }
    let cancelled = false;
    setGenreItems(null);
    catalog.byGenre(genre).then((items) => {
      const withPosters = items.filter((m) => m.poster_path).slice(0, 40);
      genreCache[genre] = withPosters;
      if (!cancelled) setGenreItems(withPosters);
    });
    return () => { cancelled = true; };
  }, [genre]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q) => {
    // Ignore responses that arrive after a newer search started.
    const id = ++requestRef.current;
    if (!q.trim()) { setResults([]); setSearchedQuery(''); setSearching(false); return; }
    setSearching(true);
    const res = await searchTitles(q);
    if (id !== requestRef.current) return;
    setResults(res);
    setSearchedQuery(q);
    setSearching(false);
  }, []);

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) doSearch('');
    else debounceRef.current = setTimeout(() => doSearch(val), 300);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      clearTimeout(debounceRef.current);
      doSearch(query);
    }
  }

  function closeDetail() {
    setSelectedMovie(null);
    // Opening a title adds it to "Recently viewed".
    setRecent(readRecent());
  }

  const loadedSections = SECTIONS.filter((s) => sections[s.id]?.length > 0);
  const genreName = GENRES.find(([id]) => id === genre)?.[1];

  let view = 'pending';
  if (query.trim()) {
    if (results.length > 0) view = 'results';
    else if (!searching && searchedQuery === query) view = 'none';
  } else if (genre) {
    view = genreItems ? 'genre' : 'skeleton';
  } else {
    view = loadedSections.length > 0 ? 'default' : 'skeleton';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.2 } }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ minHeight: '100vh' }}
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
          <div style={{ width: '100%', maxWidth: 1100, minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center', marginBottom: 32 }}
            >
              <h1
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                }}
              >
                Explore
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 300 }}>
                Search movies and TV shows, or browse what's popular
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              style={{ position: 'relative', maxWidth: 600, margin: '0 auto 20px' }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Search movies & TV shows..."
                aria-label="Search movies and TV shows"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  paddingRight: 56,
                  background: 'rgba(20, 20, 20, 0.8)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-brown)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: 18,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 20,
                  opacity: searching ? 1 : 0.5,
                }}
              >
                {searching ? '⌛' : '🔍'}
              </span>
            </motion.div>

            {!query.trim() && (
              <div
                className="h-scroll"
                role="group"
                aria-label="Browse by genre"
                style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 2px 10px', marginBottom: 28, justifyContent: 'safe center' }}
              >
                {GENRES.map(([id, name]) => {
                  const active = genre === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setGenre(active ? null : id)}
                      aria-pressed={active}
                      style={{
                        flex: '0 0 auto',
                        padding: '8px 16px',
                        borderRadius: 100,
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        background: active ? 'var(--accent-brown)' : 'rgba(20,20,20,0.75)',
                        color: active ? '#0a0a0a' : 'var(--text-secondary)',
                        border: `1px solid ${active ? 'var(--accent-brown)' : 'var(--border)'}`,
                        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
              {view === 'results' && (
                <Grid key={`results-${searchedQuery}`} title="Search results" items={results} onSelect={setSelectedMovie} />
              )}

              {view === 'genre' && (
                <Grid key={`genre-${genre}`} title={`Popular in ${genreName}`} items={genreItems} onSelect={setSelectedMovie} />
              )}

              {view === 'default' && (
                <motion.div
                  key="default-sections"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 36 }}
                >
                  {!user && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(184,134,74,0.12), rgba(139,107,74,0.08))',
                        border: '1px solid rgba(184,134,74,0.25)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>
                        Sign in to sync your watchlist across all your devices
                      </p>
                      <motion.button
                        onClick={() => setShowAuth(true)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          padding: '8px 20px',
                          background: 'linear-gradient(135deg, rgba(184,134,74,0.4), rgba(210,180,140,0.2) 35%, rgba(255,245,235,0.2) 46%, rgba(255,255,255,0.3) 50%, rgba(255,245,235,0.2) 54%, rgba(210,180,140,0.2) 65%, rgba(184,134,74,0.4))',
                          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 'var(--radius-md)',
                          color: '#f5f0e8', fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        Sign In
                      </motion.button>
                    </div>
                  )}

                  {recent.length > 0 && <Row title="Recently viewed" items={recent} onSelect={setSelectedMovie} />}
                  {loadedSections.map((s) => (
                    <Row key={s.id} title={s.title} items={sections[s.id]} onSelect={setSelectedMovie} />
                  ))}
                </motion.div>
              )}

              {view === 'skeleton' && (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SkeletonCard count={12} />
                </motion.div>
              )}

              {view === 'none' && (
                <motion.p
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  role="status"
                  style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 15, padding: 40 }}
                >
                  Nothing found for "{query}"
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

      <AnimatePresence>
        {selectedMovie && (
          <MovieDetail
            key="detail"
            movie={selectedMovie}
            watchlistMovies={watchlistMovies}
            onClose={closeDetail}
            onAddToWatchlist={onAddToWatchlist}
          />
        )}
        {showAuth && <AuthModal key="auth" onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
