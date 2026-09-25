import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar({ currentScreen, onNavigate }) {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '0 clamp(16px, 4vw, 32px)',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <motion.button
          onClick={() => onNavigate('welcome')}
          aria-label="CinemaMatch home"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 0,
          }}
        >
          <span
            className="gradient-text"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            CinemaMatch
          </span>
        </motion.button>

        <div className="nav-links" style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          flexShrink: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
        }}>
          <NavButton
            label="Home"
            active={currentScreen === 'welcome'}
            onClick={() => onNavigate('welcome')}
          />
          <NavButton
            label="Search"
            active={currentScreen === 'search'}
            onClick={() => onNavigate('search')}
          />
          <NavButton
            label="Watchlist"
            active={currentScreen === 'watchlist'}
            onClick={() => onNavigate('watchlist')}
          />
          {user ? (
            <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <motion.button
                onClick={() => setMenuOpen((o) => !o)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px 6px 6px',
                  background: 'rgba(139,107,74,0.15)',
                  border: '1px solid rgba(139,107,74,0.3)',
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--accent-brown)', color: '#fff',
                  fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {(user.email || 'U')[0].toUpperCase()}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email || ''}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>{menuOpen ? '▲' : '▼'}</span>
              </motion.button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 4,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', overflow: 'hidden',
                      minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200,
                    }}
                  >
                    <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', wordBreak: 'break-all' }}>
                      {user.email}
                    </div>
                    <button
                      onClick={() => { signOut(); setMenuOpen(false); }}
                      style={{
                        width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                        color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              onClick={() => setShowAuth(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                marginLeft: 8, padding: '8px 16px',
                background: 'transparent',
                border: '1px solid var(--accent-brown)',
                borderRadius: 8, color: 'var(--accent-brown)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Sign In
            </motion.button>
          )}
        </div>
      </motion.nav>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </>
  );
}

function NavButton({ label, active, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        padding: '8px 16px',
        background: active ? 'rgba(139, 107, 74, 0.15)' : 'transparent',
        border: `1px solid ${active ? 'rgba(139, 107, 74, 0.3)' : 'transparent'}`,
        borderRadius: 8,
        color: active ? 'var(--accent-brown)' : 'var(--text-secondary)',
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s, color 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      {label}
    </motion.button>
  );
}
