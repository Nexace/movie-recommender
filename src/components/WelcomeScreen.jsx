import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { isModalOpen } from '../hooks/useModal';

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function WelcomeScreen({ onStart, onWatchlist, onSearch }) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  useEffect(() => {
    function handleKey(e) {
      // Leave Enter alone when a button, link or field has focus, or a modal is open.
      if (e.key !== 'Enter' || isModalOpen()) return;
      if (e.target.closest?.('button, a, input, textarea, select')) return;
      onStart();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  const titleChars = 'CinemaMatch'.split('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      style={{ minHeight: '100vh' }}
    >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '96px 20px 40px',
          }}
        >
          <motion.div
            variants={staggerVariants}
            initial="hidden"
            animate="visible"
            style={{
              textAlign: 'center',
              maxWidth: 700,
            }}
          >
            <motion.div
              style={{
                display: 'inline-flex',
                gap: '4px',
                marginBottom: 24,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
              variants={childVariants}
            >
              <span
                style={{
                  background: 'rgba(184, 134, 74, 0.15)',
                  color: '#d4a85c',
                  padding: '6px 18px',
                  borderRadius: 100,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  border: '1px solid rgba(184, 134, 74, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                Powered by TMDB
              </span>
            </motion.div>

            <motion.h1
              variants={childVariants}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(3rem, 10vw, 6rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: 20,
                letterSpacing: '-0.02em',
              }}
            >
              {titleChars.map((char, i) => (
                <motion.span
                  key={i}
                  style={{
                    display: 'inline-block',
                    background:
                    char === 'C' || char === 'M'
                      ? 'linear-gradient(135deg, #b8864a, #d4a85c, #e8c88a)'
                      : 'linear-gradient(135deg, #b0b0b0, #d4d4d4, #ececec)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  initial={{ opacity: 0, y: 60, rotateX: -40 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    transition: {
                      delay: 0.5 + i * 0.04,
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              variants={childVariants}
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                maxWidth: 520,
                margin: '0 auto 40px',
                fontWeight: 300,
              }}
            >
              Tell us your mood, your vibe, and who you're with.
              <br />
              We'll find the perfect movie for your night.
            </motion.p>

            <motion.div
              variants={childVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.12), rgba(184, 134, 74, 0.06) 40%, rgba(232, 200, 138, 0.1) 48%, rgba(255, 248, 240, 0.12) 50%, rgba(232, 200, 138, 0.1) 52%, rgba(184, 134, 74, 0.06) 60%, rgba(184, 134, 74, 0.12))',
                borderRadius: 60,
                border: '1px solid rgba(184, 134, 74, 0.2)',
                width: '100%',
                maxWidth: 320,
                margin: '0 auto',
              }}
            >
              <motion.button
                onClick={onStart}
                style={{
                  background: 'transparent',
                  color: '#e8c88a',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  padding: '16px clamp(32px, 10vw, 48px)',
                  borderRadius: 60,
                  fontSize: 'clamp(16px, 4vw, 18px)',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Get Started
              </motion.button>
            </motion.div>

            <motion.div
              variants={childVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.12), rgba(184, 134, 74, 0.06) 40%, rgba(232, 200, 138, 0.1) 48%, rgba(255, 248, 240, 0.12) 50%, rgba(232, 200, 138, 0.1) 52%, rgba(184, 134, 74, 0.06) 60%, rgba(184, 134, 74, 0.12))',
                borderRadius: 60,
                border: '1px solid rgba(184, 134, 74, 0.2)',
                width: '100%',
                maxWidth: 320,
                margin: '16px auto 0',
              }}
            >
              <motion.button
                onClick={onSearch}
                style={{
                  background: 'transparent',
                  color: '#e8c88a',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  padding: '16px clamp(32px, 10vw, 48px)',
                  borderRadius: 60,
                  fontSize: 'clamp(16px, 4vw, 18px)',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Search Movies
              </motion.button>
            </motion.div>

            <motion.div
              variants={childVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.12), rgba(184, 134, 74, 0.06) 40%, rgba(232, 200, 138, 0.1) 48%, rgba(255, 248, 240, 0.12) 50%, rgba(232, 200, 138, 0.1) 52%, rgba(184, 134, 74, 0.06) 60%, rgba(184, 134, 74, 0.12))',
                borderRadius: 60,
                border: '1px solid rgba(184, 134, 74, 0.2)',
                width: '100%',
                maxWidth: 320,
                margin: '16px auto 0',
              }}
            >
              <motion.button
                onClick={onWatchlist}
                style={{
                  background: 'transparent',
                  color: '#e8c88a',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  padding: '16px clamp(32px, 10vw, 48px)',
                  borderRadius: 60,
                  fontSize: 'clamp(16px, 4vw, 18px)',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                My Watchlist
              </motion.button>
            </motion.div>

            {!user && (
              <motion.div variants={childVariants} style={{ marginTop: 24, textAlign: 'center' }}>
                <motion.button
                  onClick={() => setShowAuth(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '10px 24px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Sign In to Sync Your Watchlist
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            style={{
              marginTop: 48,
              color: 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{ delay: 2.5, duration: 2, repeat: Infinity }}
          >
            Discover your next watch
          </motion.div>
        </div>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
