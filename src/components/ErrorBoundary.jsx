import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: 40,
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎬</div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, rgba(184, 134, 74, 0.45), rgba(210, 180, 140, 0.25) 35%, rgba(255, 245, 235, 0.25) 46%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 245, 235, 0.25) 54%, rgba(210, 180, 140, 0.25) 65%, rgba(184, 134, 74, 0.45))',
                color: '#f5f0e8',
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                fontWeight: 600,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
