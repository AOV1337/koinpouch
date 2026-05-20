import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '480px',
      }}>

        {/* 404 display — flair placeholder, will be replaced with proper asset later */}
        <div style={{
          fontSize: '6rem',
          fontWeight: 900,
          color: 'var(--color-primary)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          marginBottom: '0.5rem',
          opacity: 0.15,
          userSelect: 'none',
        }}>
          404
        </div>

        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          🔍
        </div>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 900,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '0.75rem',
        }}>
          Page not found
        </h1>

        <p style={{
          fontSize: '1rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.7,
          marginBottom: '2rem',
        }}>
          We couldn't find the page you were looking for. It may have been moved, deleted, or never existed in the first place.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/"
            style={{
              padding: '12px 32px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            Go back home
          </Link>

          <Link
            to="/support"
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Is something wrong? Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}