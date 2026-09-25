import { motion } from 'framer-motion';

export default function SkeletonCard({ count = 6, compact }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 'clamp(12px, 2vw, 20px)',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          }}
          style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="skeleton"
            style={{
              width: '100%',
              aspectRatio: '2/3',
              borderRadius: 0,
            }}
          />
          <div
            style={{
              padding: compact
                ? '10px 12px 12px'
                : 'clamp(10px, 2vw, 14px) clamp(12px, 2vw, 16px) clamp(12px, 2vw, 16px)',
            }}
          >
            <div
              className="skeleton"
              style={{
                height: compact ? 14 : 16,
                width: '80%',
                marginBottom: compact ? 6 : 8,
              }}
            />
            <div
              className="skeleton"
              style={{
                height: compact ? 11 : 13,
                width: '40%',
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
