import { motion } from 'framer-motion';

const CATEGORIES = [
  { key: 'plot', label: 'Plot' },
  { key: 'cinematography', label: 'Cinematography' },
  { key: 'soundtrack', label: 'Soundtrack' },
  { key: 'overall', label: 'Overall' },
];

const STAR_COLORS = ['#8b6b4a', '#909090', '#a0784c', '#c9a84c'];

export default function RatingPanel({ ratings = {}, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {CATEGORIES.map((cat, ci) => {
        const value = ratings[cat.key] || 0;
        return (
          <div key={cat.key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.3px',
                }}
              >
                {cat.label}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: value > 0 ? STAR_COLORS[ci] : 'var(--text-muted)',
                  minWidth: 24,
                  textAlign: 'right',
                }}
              >
                {value > 0 ? value : '-'}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 4,
                alignItems: 'center',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                const active = star <= value;
                return (
                  <motion.button
                    key={star}
                    onClick={() => onChange(cat.key, star === value ? 0 : star)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={`${cat.label} rating ${star} of 10`}
                    style={{
                      width: '100%',
                      minHeight: 44,
                      height: 44,
                      border: 'none',
                      borderRadius: 4,
                      background: active
                        ? STAR_COLORS[ci]
                        : 'var(--bg-card)',
                      cursor: 'pointer',
                      opacity: active ? 1 : 0.4,
                      transition: 'opacity 0.15s, background 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.opacity = '0.7';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.opacity = '0.4';
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
