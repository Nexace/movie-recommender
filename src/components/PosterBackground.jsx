import { useState, useEffect, useRef, useCallback } from 'react';
import { getPosterUrl } from '../api/tmdb';

const DESKTOP_COLUMNS = 8;
const TABLET_COLUMNS = 6;
const MOBILE_COLUMNS = 5;
const ROWS = 5;
const TOTAL_SLOTS = DESKTOP_COLUMNS * ROWS;
// One poster changes at a time on a steady beat, so the wall never "pulses".
const SWAP_EVERY_MS = 900;

let uid = 0;

const cachedMovies = { current: null };
const cachedPosters = { current: null };

function makePoster(movie, index = 0) {
  return {
    id: ++uid,
    src: getPosterUrl(movie?.poster_path, 'w342'),
    scale: 0.7 + Math.random() * 0.4,
    rotation: (Math.random() - 0.5) * 6,
    targetOpacity: 0.45 + Math.random() * 0.25,
    // Stagger the first reveal so the wall fills in gradually.
    delay: index * 45 + Math.random() * 400,
    prev: null,
  };
}

function generateInitialPosters(movies) {
  return Array.from({ length: TOTAL_SLOTS }, (_, i) =>
    makePoster(movies[i % Math.max(movies.length, 1)], i)
  );
}

function preload(src) {
  const img = new Image();
  img.src = src;
  return img.decode().catch(() => {});
}

function posterStyle(p) {
  return {
    '--r': `${p.rotation}deg`,
    '--s': p.scale,
    '--o': p.targetOpacity,
    animationDelay: p.delay ? `${p.delay}ms` : undefined,
  };
}

// Start the fade only once the image has pixels to show.
function startFade(e) {
  e.currentTarget.style.animationPlayState = 'running';
}

export default function PosterBackground({ brightness = 0.85 }) {
  const [movies, setMovies] = useState(cachedMovies.current || []);
  const [posters, setPosters] = useState(cachedPosters.current || []);
  const [columns, setColumns] = useState(DESKTOP_COLUMNS);
  const rows = Math.ceil(TOTAL_SLOTS / columns);
  const postersRef = useRef(posters);
  const moviesRef = useRef(movies);
  const swappingRef = useRef(false);

  postersRef.current = posters;
  moviesRef.current = movies;

  useEffect(() => {
    function updateColumns() {
      const w = window.innerWidth;
      if (w < 480) setColumns(MOBILE_COLUMNS);
      else if (w < 768) setColumns(TABLET_COLUMNS);
      else setColumns(DESKTOP_COLUMNS);
    }
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    if (cachedPosters.current && cachedMovies.current) return;

    if (cachedMovies.current) {
      setMovies(cachedMovies.current);
      const initial = generateInitialPosters(cachedMovies.current);
      cachedPosters.current = initial;
      setPosters(initial);
      return;
    }

    async function load() {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;
      if (!apiKey) return;
      try {
        const pages = [1, 2, 3, 4];
        const all = await Promise.all([
          ...pages.map((p) =>
            fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=${p}`).then((r) => r.json())
          ),
          ...pages.map((p) =>
            fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=en-US&page=${p}`).then((r) => r.json())
          ),
        ]);

        const combined = all.flatMap((d) => d.results || []).filter((m) => m?.poster_path);
        if (combined.length > 0) {
          cachedMovies.current = combined;
          setMovies(combined);
          const initial = generateInitialPosters(combined);
          cachedPosters.current = initial;
          setPosters(initial);
        }
      } catch (err) {
        console.error('Background load failed:', err);
      }
    }
    load();
  }, []);

  const swapOne = useCallback(async () => {
    const current = postersRef.current;
    const movieList = moviesRef.current;
    // One swap in flight at a time, so a slow image can't make several land at once.
    if (current.length === 0 || movieList.length === 0 || document.hidden || swappingRef.current) return;

    // Only pick slots that aren't already mid-crossfade.
    const idle = current.map((p, i) => (p.prev ? -1 : i)).filter((i) => i !== -1);
    if (idle.length === 0) return;
    const slot = idle[Math.floor(Math.random() * idle.length)];

    // Avoid putting a poster on screen that is already visible.
    const onScreen = new Set(current.map((p) => p.src));
    let movie;
    for (let tries = 0; tries < 10; tries++) {
      movie = movieList[Math.floor(Math.random() * movieList.length)];
      if (!onScreen.has(getPosterUrl(movie.poster_path, 'w342'))) break;
    }
    const next = { ...makePoster(movie), delay: 0 };

    // Decode off the main thread first so the fade never starts on a blank frame.
    swappingRef.current = true;
    await preload(next.src);
    swappingRef.current = false;

    setPosters((prev) => {
      const old = prev[slot];
      if (!old || old.prev) return prev;
      const updated = [...prev];
      updated[slot] = { ...next, prev: { ...old, delay: 0 } };
      cachedPosters.current = updated;
      return updated;
    });
  }, []);

  // Drop the old poster once it has fully faded, freeing the slot for another swap.
  const finishSwap = useCallback((prevId) => {
    setPosters((prev) => {
      const updated = prev.map((p) => (p.prev?.id === prevId ? { ...p, prev: null } : p));
      cachedPosters.current = updated;
      return updated;
    });
  }, []);

  useEffect(() => {
    if (movies.length === 0) return;
    // With reduced motion the posters only fade (no zoom), and change less often.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setInterval(swapOne, reduced ? SWAP_EVERY_MS * 3 : SWAP_EVERY_MS);
    return () => clearInterval(timer);
  }, [movies.length, swapOne]);

  return (
    <div aria-hidden="true">
      <div
          className="poster-drift"
          style={{
            position: 'fixed',
            inset: '-10%',
            zIndex: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            alignItems: 'center',
            filter: `brightness(${brightness})`,
            pointerEvents: 'none',
          }}
        >
        {posters.map((p, i) => (
          <div key={i} style={{ overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' }}>
              {p.src && (
                <img
                  key={p.id}
                  src={p.src}
                  alt=""
                  decoding="async"
                  className="bg-poster poster-in"
                  style={posterStyle(p)}
                  onLoad={startFade}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              {p.prev?.src && (
                <img
                  key={p.prev.id}
                  src={p.prev.src}
                  alt=""
                  className="bg-poster poster-out"
                  style={posterStyle(p.prev)}
                  onAnimationEnd={() => finishSwap(p.prev.id)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          background: `
            radial-gradient(ellipse 55% 50% at 50% 50%, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.45) 55%, transparent 100%),
            linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.12) 35%, rgba(10,10,10,0.65) 90%),
            radial-gradient(ellipse 60% 30% at 50% 50%, rgba(184,134,74,0.08) 0%, transparent 70%)
          `,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
