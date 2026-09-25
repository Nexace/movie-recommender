import { useState, useEffect } from 'react';
import { getWatchProviders, getPosterUrl, getRegion, regionName } from '../api/tmdb';

export default function WatchProviders({ movieId, mediaType = 'movie', compact }) {
  const [providers, setProviders] = useState(null);
  const [country, setCountry] = useState(null);

  useEffect(() => {
    if (!movieId) return;
    let cancelled = false;
    setProviders(null);
    getWatchProviders(movieId, mediaType).then((data) => {
      if (cancelled || !data) return;
      const keys = Object.keys(data);
      if (keys.length === 0) return;
      // Your own country first, then the US, then anywhere it's available.
      const region = getRegion();
      const preferred = keys.includes(region) ? region : keys.includes('US') ? 'US' : keys[0];
      setCountry(preferred);
      setProviders(data[preferred]);
    });
    return () => { cancelled = true; };
  }, [movieId, mediaType]);

  const { flatrate, rent, buy, link } = providers || {};
  const hasAny = flatrate?.length || rent?.length || buy?.length;
  // Compact cards keep the row's height so the grid doesn't jump when logos arrive.
  if (!hasAny) return compact ? <div style={{ height: 32 }} /> : null;

  const renderProvider = (p) => {
    const logo = getPosterUrl(p.logo_path, 'w154');
    return logo ? (
      <img
        key={p.provider_id || p.provider_name}
        src={logo}
        alt={p.provider_name}
        title={p.provider_name}
        loading="lazy"
        style={{
          width: compact ? 24 : 32,
          height: compact ? 24 : 32,
          borderRadius: 6,
          objectFit: 'cover',
          background: '#fff',
        }}
      />
    ) : null;
  };

  if (compact) {
    return (
      <div style={{ marginTop: 8, height: 24, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {flatrate?.slice(0, 4).map(renderProvider)}
          {flatrate?.length > 4 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{flatrate.length - 4}</span>
          )}
          {!flatrate?.length && rent?.slice(0, 2).map(renderProvider)}
          {!flatrate?.length && !rent?.length && buy?.slice(0, 2).map(renderProvider)}
        </div>
      </div>
    );
  }

  const sections = [];
  if (flatrate?.length) sections.push({ label: 'Stream', items: flatrate });
  if (rent?.length) sections.push({ label: 'Rent', items: rent });
  if (buy?.length) sections.push({ label: 'Buy', items: buy });

  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
        Where to Watch
        {country && (
          <span style={{ fontWeight: 400, marginLeft: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            ({regionName(country)})
          </span>
        )}
      </h4>
      {sections.map((section) => (
        <div key={section.label} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', minWidth: 52 }}>{section.label}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {section.items.map((p) => {
              const logo = getPosterUrl(p.logo_path, 'w154');
              return logo ? (
                <a
                  key={p.provider_id || p.provider_name}
                  href={link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={p.provider_name}
                  style={{ display: 'block', lineHeight: 0, borderRadius: 8, overflow: 'hidden', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <img
                    src={logo}
                    alt={p.provider_name}
                    loading="lazy"
                    style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', background: '#fff' }}
                  />
                </a>
              ) : null;
            })}
          </div>
        </div>
      ))}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
            color: 'var(--accent-gold)', marginTop: 4, textDecoration: 'none',
          }}
        >
          View all options →
        </a>
      )}
    </div>
  );
}
