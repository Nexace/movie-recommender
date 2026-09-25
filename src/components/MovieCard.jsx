import { useState } from 'react';
import { motion } from 'framer-motion';
import { getPosterUrl } from '../api/tmdb';
import WatchProviders from './WatchProviders';

const loadedImages = new Set();

export default function MovieCard({ movie, index, onClick, matchScore }) {
  const [loaded, setLoaded] = useState(loadedImages.has(movie.poster_path));
  const posterUrl = getPosterUrl(movie.poster_path);
  const year = movie.release_date?.split('-')[0] || '';
  const rating = movie.vote_average?.toFixed(1) || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      onClick={() => onClick(movie)}
      style={{
        cursor: 'pointer',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        position: 'relative',
        transition: 'border-color 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-gold)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '2/3',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}
      >
        {posterUrl ? (
          <>
            {!loaded && <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />}
            <motion.img
              src={posterUrl}
              alt={movie.title}
              onLoad={() => { loadedImages.add(movie.poster_path); setLoaded(true); }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </>
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
            No poster available
          </div>
        )}

        {rating && (
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
            {rating}
          </div>
        )}
        {movie.media_type === 'tv' && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: 'var(--text-primary)',
            }}
          >
            TV
          </div>
        )}
        {matchScore != null && (
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.85), rgba(212, 168, 92, 0.85))',
              backdropFilter: 'blur(6px)',
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              color: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {matchScore}% Match
          </div>
        )}
      </div>

      <div style={{ padding: 'clamp(10px, 2vw, 14px) clamp(12px, 2vw, 16px) clamp(12px, 2vw, 16px)' }}>
        <h3
          style={{
            fontSize: 'clamp(13px, 2vw, 15px)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            marginBottom: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {movie.title}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          {year && <span>{year}</span>}
          {movie.original_language && (
            <span
              style={{
                textTransform: 'uppercase',
                background: 'var(--bg-secondary)',
                padding: '1px 6px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {movie.original_language}
            </span>
          )}
        </div>
        <WatchProviders movieId={movie.id} mediaType={movie.media_type} compact />
      </div>
    </motion.div>
  );
}
