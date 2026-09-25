import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isModalOpen } from '../hooks/useModal';
import { isAnswered } from '../hooks/useQuizState';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';

export default function Quiz({
  step,
  direction,
  currentQuestion,
  answers,
  progress,
  isFirst,
  isLast,
  isCurrentValid,
  totalQuestions,
  onNext,
  onPrev,
  onAnswer,
  onSubmit,
  loading,
}) {
  // Single-choice questions move on by themselves shortly after a tap.
  const advanceRef = useRef(null);
  useEffect(() => () => clearTimeout(advanceRef.current), [step]);
  function handlePicked() {
    clearTimeout(advanceRef.current);
    if (!isLast) advanceRef.current = setTimeout(onNext, 280);
  }

  const skippable = currentQuestion.optional && !isAnswered(currentQuestion, answers);

  useEffect(() => {
    function handleKey(e) {
      if (e.key !== 'Enter' || isModalOpen()) return;
      // Enter on a focused answer should advance, not toggle that answer again.
      if (e.target.closest?.('[data-quiz-option]')) e.preventDefault();
      else if (e.target.closest?.('button, a, input, textarea, select')) return;
      if (isLast && isCurrentValid && !loading) onSubmit();
      else if (!isLast && isCurrentValid) onNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLast, isCurrentValid, loading, onSubmit, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40, transition: { duration: 0.2 } }}
    >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '96px 20px 40px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 640,
              background: 'rgba(10, 10, 10, 0.5)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-xl)',
              padding: 'clamp(24px, 4vw, 40px) clamp(16px, 3vw, 36px)',
              boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ marginBottom: 36 }}>
              <ProgressBar progress={progress} current={step} total={totalQuestions} />
            </div>

            <div
              style={{
                minHeight: 300,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  answers={answers}
                  direction={direction}
                  onAnswer={onAnswer}
                  onPicked={handlePicked}
                />
              </AnimatePresence>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 32,
                gap: 12,
                flexWrap: 'wrap-reverse',
              }}
            >
              {!isFirst ? (
                <motion.button
                  onClick={onPrev}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '14px 28px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-brown)';
                    e.currentTarget.style.color = 'var(--accent-brown)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  Back
                </motion.button>
              ) : (
                <div />
              )}

              {!isLast ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <motion.button
                    onClick={onNext}
                    disabled={!isCurrentValid}
                    whileHover={isCurrentValid ? { scale: 1.02 } : {}}
                    whileTap={isCurrentValid ? { scale: 0.98 } : {}}
                    style={{
                      padding: '14px 36px',
                      background: isCurrentValid
                        ? 'linear-gradient(135deg, rgba(184, 134, 74, 0.45), rgba(210, 180, 140, 0.25) 35%, rgba(255, 245, 235, 0.25) 46%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 245, 235, 0.25) 54%, rgba(210, 180, 140, 0.25) 65%, rgba(184, 134, 74, 0.45))'
                        : 'var(--border)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      color: isCurrentValid ? '#f5f0e8' : 'var(--text-muted)',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: isCurrentValid ? 'pointer' : 'not-allowed',
                      opacity: isCurrentValid ? 1 : 0.5,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {skippable ? 'Skip' : 'Next'} <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 400 }}>↵</span>
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={onSubmit}
                  disabled={!isCurrentValid || loading}
                  whileHover={isCurrentValid ? { scale: 1.02 } : {}}
                  whileTap={isCurrentValid ? { scale: 0.98 } : {}}
                  style={{
                    padding: '14px 36px',
                    background: isCurrentValid
                      ? 'linear-gradient(135deg, rgba(184, 134, 74, 0.45), rgba(210, 180, 140, 0.25) 35%, rgba(255, 245, 235, 0.25) 46%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 245, 235, 0.25) 54%, rgba(210, 180, 140, 0.25) 65%, rgba(184, 134, 74, 0.45))'
                      : 'var(--border)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    color: isCurrentValid ? '#f5f0e8' : 'var(--text-muted)',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: isCurrentValid && !loading ? 'pointer' : 'not-allowed',
                    opacity: isCurrentValid && !loading ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                        display: 'inline-block',
                      }} />
                      Finding picks...
                    </>
                  ) : (
                    'Get my picks'
                  )}
                </motion.button>
              )}
            </div>

          </div>
        </div>
    </motion.div>
  );
}
