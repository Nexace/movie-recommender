import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { getDetails, getPosterUrl, fetchExternalRatings, itemKey, normalize } from '../api/tmdb';
import WatchProviders from './WatchProviders';
import { useToast } from './Toast';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useModal } from '../hooks/useModal';

export default function MovieDetail({ movie: initialMovie, onClose, watchlistMovies = [], onAddToWatchlist, onEditRatings }) {
  // "More like this" swaps the title shown here without closing the modal.
  const [movie, setMovie] = useState(() => normalize(initialMovie));
  const [details, setDetails] = useState(null);
  const [externalRatings, setExternalRatings] = useState(null);
  const { showToast } = useToast();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const scrollRef = useRef(null);
  useModal(onClose);

  const isTv = movie.media_type === 'tv';
  const watchlistMovie = watchlistMovies.find((m) => itemKey(m) === movie.key);

  useEffect(() => {
    addToRecentlyViewed(movie);
    setDetails(null);
    setExternalRatings(null);
    scrollRef.current?.scrollTo({ top: 0 });
    let cancelled = false;
    getDetails(movie.id, movie.media_type).then((data) => {
      if (cancelled) return;
      setDetails(data);
      if (data?.external_ids?.imdb_id) {
        fetchExternalRatings(data.external_ids.imdb_id).then((ratings) => {
          if (!cancelled) setExternalRatings(ratings);
        });
      }
    });
    return () => { cancelled = true; };
  }, [movie.key]);

  const posterUrl = getPosterUrl(movie.poster_path, 'w780');
  const backdropUrl = getPosterUrl(movie.backdrop_path || details?.backdrop_path, 'w1280');
  const year = movie.release_date?.split('-')[0] || '';
  const runtime = details?.runtime;
  const seasons = details?.number_of_seasons;
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '';
  const moreLikeThis = details?.recommendations?.slice(0, 10) || [];
  const overview = details?.overview || movie.overview || '';
  const cast = details?.credits?.cast?.slice(0, 5) || [];
  const imdbId = details?.external_ids?.imdb_id;
  const trailer = details?.videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );

  return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="modal-backdrop"
        ref={scrollRef}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={movie.title}
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            margin: 'auto',
            maxWidth: 720,
            width: '100%',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}
        >
          {backdropUrl && (
            <div
              style={{
                position: 'relative',
                height: 'clamp(160px, 30vw, 240px)',
                overflow: 'hidden',
                background: `url(${backdropUrl}) center/cover no-repeat`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(0deg, var(--bg-primary) 0%, transparent 60%)',
                }}
              />
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  color: 'white',
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                  zIndex: 2,
                }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(16px, 4vw, 28px) clamp(20px, 4vw, 28px)' }}>
            <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 20px)', marginBottom: 20 }}>
              {posterUrl && (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  style={{
                    width: 'clamp(72px, 15vw, 100px)',
                    height: 'clamp(108px, 22vw, 150px)',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid var(--border)',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                    lineHeight: 1.2,
                  }}
                >
                  {movie.title}
                </h2>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    marginBottom: 12,
                  }}
                >
                  {isTv && (
                    <span style={{ background: 'var(--accent-brown-dim)', color: 'var(--accent-gold)', padding: '0 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                      TV
                    </span>
                  )}
                  {year && <span>{isTv && details?.in_production ? `${year}–` : year}</span>}
                  {seasons && <span>{seasons} {seasons === 1 ? 'season' : 'seasons'}</span>}
                  {runtime && <span>{isTv ? `~${runtime} min/ep` : `${runtime} min`}</span>}
                  {rating && (
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
                      ★ {rating}
                    </span>
                  )}
                  {details?.genres?.slice(0, 3).map((g) => (
                    <span
                      key={g.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        padding: '2px 10px',
                        borderRadius: 100,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                {imdbId && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    {externalRatings?.imdb && (
                      <a
                        href={`https://www.imdb.com/title/${imdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          background: 'rgba(245, 197, 24, 0.12)',
                          border: '1px solid rgba(245, 197, 24, 0.25)',
                          borderRadius: 100,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#f5c518',
                          textDecoration: 'none',
                        }}
                      >
                        IMDb {externalRatings.imdb}
                      </a>
                    )}
                    {externalRatings?.rottenTomatoes && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          background: 'rgba(250, 60, 50, 0.1)',
                          border: '1px solid rgba(250, 60, 50, 0.2)',
                          borderRadius: 100,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#fa3c32',
                        }}
                      >
                        🍅 {externalRatings.rottenTomatoes}
                      </span>
                    )}
                    {externalRatings?.metacritic && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border)',
                          borderRadius: 100,
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        MC {externalRatings.metacritic}
                      </span>
                    )}
                    {!isTv && <a
                      href={`https://letterboxd.com/imdb/${imdbId}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 12px',
                        background: 'rgba(55, 200, 115, 0.1)',
                        border: '1px solid rgba(55, 200, 115, 0.2)',
                        borderRadius: 100,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#37c873',
                        textDecoration: 'none',
                      }}
                    >
                      Letterboxd
                    </a>}
                  </div>
                )}
              </div>
            </div>

            {overview && (
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                  marginBottom: 20,
                }}
              >
                {overview}
              </p>
            )}

            <WatchProviders movieId={movie.id} mediaType={movie.media_type} />

            {cast.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: 8,
                  }}
                >
                  Cast
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cast.map((person) => (
                    <span
                      key={person.id}
                      style={{
                        background: 'var(--bg-card)',
                        padding: '4px 12px',
                        borderRadius: 100,
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {person.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {onAddToWatchlist && (
              <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {watchlistMovie ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--accent-brown)', fontWeight: 600 }}>
                      In your watchlist
                      {watchlistMovie.ratings?.overall ? ` · Rated ${watchlistMovie.ratings.overall}/10` : ''}
                    </span>
                    {onEditRatings && (
                      <motion.button
                        onClick={() => onEditRatings(watchlistMovie)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '8px 16px',
                          background: 'transparent',
                          border: '1px solid var(--accent-brown)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--accent-brown)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Edit Ratings
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <motion.button
                    onClick={async () => {
                      if (onAddToWatchlist) {
                        await onAddToWatchlist({
                          id: movie.id,
                          media_type: movie.media_type,
                          title: movie.title,
                          poster_path: movie.poster_path,
                          backdrop_path: movie.backdrop_path,
                          overview: movie.overview,
                          release_date: movie.release_date,
                          vote_average: movie.vote_average,
                          runtime: details?.runtime,
                          original_language: movie.original_language,
                          genres: details?.genres?.map((g) => ({ id: g.id, name: g.name })) || [],
                        });
                        showToast(`${movie.title} added to watchlist`, 'success');
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.45), rgba(210, 180, 140, 0.25) 35%, rgba(255, 245, 235, 0.25) 46%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 245, 235, 0.25) 54%, rgba(210, 180, 140, 0.25) 65%, rgba(184, 134, 74, 0.45))',
                      color: '#f5f0e8',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 14,
                      fontWeight: 700,
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    + Add to Watchlist
                  </motion.button>
                )}
              </div>
            )}

            {moreLikeThis.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
                  More like this
                </h4>
                <div className="h-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, overscrollBehavior: 'contain' }}>
                  {moreLikeThis.map((rec) => (
                    <button
                      key={rec.key}
                      onClick={() => setMovie(rec)}
                      title={rec.title}
                      style={{ flex: '0 0 auto', width: 92, background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                    >
                      <img
                        src={getPosterUrl(rec.poster_path, 'w185')}
                        alt=""
                        loading="lazy"
                        style={{ width: 92, height: 138, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
                      />
                      <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rec.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {trailer && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px 24px',
                    background: 'var(--accent-gold)',
                    color: '#0a0a0f',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  ▶ Watch Trailer
                </a>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>,
    document.body
  );
}
