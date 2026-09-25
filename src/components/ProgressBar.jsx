import { motion } from 'framer-motion';

export default function ProgressBar({ progress, current, total }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.5px',
          }}
        >
          Step {current + 1} of {total}
        </span>
        <span
          style={{
            color: 'var(--accent-brown)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {Math.round(progress)}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Step ${current + 1} of ${total}`}
        style={{
          width: '100%',
          height: 4,
          background: 'var(--border)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            borderRadius: 4,
            background: 'linear-gradient(90deg, #b8864a, #d4a85c)',
            boxShadow: '0 0 10px rgba(184, 134, 74, 0.4)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
