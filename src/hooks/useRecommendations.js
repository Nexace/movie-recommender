import { useState, useCallback, useRef } from 'react';
import { getRecommendations } from '../api/recommend';

export function useRecommendations() {
  const [primaryMovies, setPrimaryMovies] = useState([]);
  const [secondaryMovies, setSecondaryMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);
  // Ignore a slow earlier request that finishes after a newer one (e.g. after Start Over).
  const requestRef = useRef(0);

  const fetchRecommendations = useCallback(async (answers) => {
    const id = ++requestRef.current;
    setLoading(true);
    setError(null);
    setFetched(true);

    try {
      const { primary, secondary } = await getRecommendations(answers);
      if (id !== requestRef.current) return;
      setPrimaryMovies(primary);
      setSecondaryMovies(secondary);
    } catch (err) {
      if (id !== requestRef.current) return;
      setError(err.message);
      setPrimaryMovies([]);
      setSecondaryMovies([]);
    } finally {
      if (id === requestRef.current) setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    requestRef.current++;
    setPrimaryMovies([]);
    setSecondaryMovies([]);
    setLoading(false);
    setError(null);
    setFetched(false);
  }, []);

  return { primaryMovies, secondaryMovies, loading, error, fetched, fetchRecommendations, reset };
}
