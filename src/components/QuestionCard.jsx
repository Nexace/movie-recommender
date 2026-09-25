import { motion } from 'framer-motion';

const cardVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: (direction) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  }),
};

// Adds or removes a pick; at the limit, the oldest pick makes way for the new one.
function toggle(list, id, max) {
  if (list.includes(id)) return list.filter((v) => v !== id);
  const next = [...list, id];
  return max && next.length > max ? next.slice(next.length - max) : next;
}

function Check({ on }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px solid ${on ? 'var(--accent-brown)' : 'var(--text-muted)'}`,
        background: on ? 'var(--accent-brown)' : 'transparent',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {on && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function OptionTile({ option, selected, index, onClick }) {
  return (
    <motion.button
      data-quiz-option
      className="hover-accent-border"
      aria-pressed={selected}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03, duration: 0.25 } }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: option.description ? '14px 16px' : '13px 16px',
        background: selected ? 'rgba(184, 134, 74, 0.14)' : 'rgba(20, 20, 20, 0.7)',
        border: `1px solid ${selected ? 'var(--accent-brown)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <Check on={selected} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: selected ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
          {option.label}
        </span>
        {option.description && (
          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {option.description}
          </span>
        )}
      </span>
    </motion.button>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      data-quiz-option
      className="hover-accent-border"
      aria-pressed={selected}
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 100,
        fontSize: 13,
        fontWeight: selected ? 700 : 500,
        background: selected ? 'var(--accent-brown)' : 'rgba(20, 20, 20, 0.7)',
        color: selected ? '#0a0a0a' : 'var(--text-secondary)',
        border: `1px solid ${selected ? 'var(--accent-brown)' : 'var(--border)'}`,
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
      }}
    >
      {label}
    </button>
  );
}

export default function QuestionCard({ question, answers, direction, onAnswer, onPicked }) {
  return (
    <motion.div
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            marginBottom: 6,
          }}
        >
          {question.question}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{question.subtitle}</p>
      </div>

      {question.type === 'details' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {question.groups.filter((g) => !g.showIf || g.showIf(answers)).map((group) => (
            <div key={group.id} role="group" aria-label={group.label}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
                {group.label}
                {group.hint && (
                  <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, marginLeft: 8 }}>({group.hint})</span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {group.options.map((opt) => {
                  const value = answers[group.id];
                  const selected = group.type === 'multi' ? value.includes(opt.id) : value === opt.id;
                  return (
                    <Chip
                      key={opt.id}
                      label={opt.label}
                      selected={selected}
                      onClick={() => onAnswer(group.id, group.type === 'multi' ? toggle(value, opt.id) : opt.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
            gap: 10,
          }}
        >
          {question.options.map((opt, i) => {
            const value = answers[question.id];
            const isMulti = question.type === 'multi';
            const selected = isMulti ? value.includes(opt.id) : value === opt.id;
            return (
              <OptionTile
                key={opt.id}
                option={opt}
                index={i}
                selected={selected}
                onClick={() => {
                  onAnswer(question.id, isMulti ? toggle(value, opt.id, question.max) : opt.id);
                  if (!isMulti) onPicked?.();
                }}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
