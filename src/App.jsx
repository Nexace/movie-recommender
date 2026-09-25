import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuizState } from './hooks/useQuizState';
import { useRecommendations } from './hooks/useRecommendations';
import { useWatchlist } from './hooks/useWatchlist';
import WelcomeScreen from './components/WelcomeScreen';
import Navbar from './components/Navbar';
import PosterBackground from './components/PosterBackground';
import Quiz from './components/Quiz';
import Results from './components/Results';
import Watchlist from './components/Watchlist';
import SearchMovies from './components/SearchMovies';

const SCREENS = { WELCOME: 'welcome', QUIZ: 'quiz', RESULTS: 'results', WATCHLIST: 'watchlist', SEARCH: 'search' };

export default function App() {
  const [screen, setScreen] = useState(SCREENS.WELCOME);
  const { movies: watchlistMovies, addMovie, updateRatings, updateNotes, removeMovie } = useWatchlist();

  const {
    step, direction, answers, currentQuestion, progress,
    isFirst, isLast, isCurrentValid, totalQuestions,
    next, prev, setAnswer, reset: resetQuiz,
  } = useQuizState();

  const {
    primaryMovies, secondaryMovies, loading, error, fetchRecommendations, reset: resetResults,
  } = useRecommendations();

  const navigate = useCallback((target) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setScreen(target);
  }, []);

  const handleStart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    resetQuiz();
    setScreen(SCREENS.QUIZ);
  }, [resetQuiz]);

  const handleSubmit = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.location.hash = '#results';
    fetchRecommendations(answers);
    setScreen(SCREENS.RESULTS);
  }, [answers, fetchRecommendations]);

  const handleReset = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.location.hash = '';
    resetQuiz();
    resetResults();
    setScreen(SCREENS.WELCOME);
  }, [resetQuiz, resetResults]);

  return (
    <>
      <PosterBackground brightness={0.85} />
      <div className="grain-overlay" />
      <Navbar currentScreen={screen} onNavigate={navigate} />
      <main style={{ position: 'relative', zIndex: 2 }}>
      <AnimatePresence mode="wait">
        {screen === SCREENS.WELCOME && (
          <WelcomeScreen key="welcome" onStart={handleStart} onWatchlist={() => navigate(SCREENS.WATCHLIST)} onSearch={() => navigate(SCREENS.SEARCH)} />
        )}
        {screen === SCREENS.QUIZ && (
          <Quiz
            key="quiz"
            step={step}
            direction={direction}
            currentQuestion={currentQuestion}
            answers={answers}
            progress={progress}
            isFirst={isFirst}
            isLast={isLast}
            isCurrentValid={isCurrentValid}
            totalQuestions={totalQuestions}
            onNext={next}
            onPrev={prev}
            onAnswer={setAnswer}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
        {screen === SCREENS.RESULTS && (
          <Results
            key="results"
            primaryMovies={primaryMovies}
            secondaryMovies={secondaryMovies}
            loading={loading}
            error={error}
            onReset={handleReset}
            watchlistMovies={watchlistMovies}
            onAddToWatchlist={addMovie}
          />
        )}
        {screen === SCREENS.WATCHLIST && (
          <Watchlist
            key="watchlist"
            watchlistMovies={watchlistMovies}
            onAddMovie={addMovie}
            onUpdateRatings={updateRatings}
            onUpdateNotes={updateNotes}
            onRemoveMovie={removeMovie}
          />
        )}
        {screen === SCREENS.SEARCH && (
          <SearchMovies
            key="search"
            watchlistMovies={watchlistMovies}
            onAddToWatchlist={addMovie}
          />
        )}
      </AnimatePresence>
      </main>
    </>
  );
}
