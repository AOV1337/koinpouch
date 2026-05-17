import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      marginTop: 'auto',
      padding: '3rem 1.5rem 2rem',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '2rem',
      }}>

        {/* Brand column */}
        <div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--color-primary)',
            marginBottom: '0.75rem',
          }}>
            Koinpouch
          </div>
          <p style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            marginBottom: '1rem',
          }}>
            The collector's marketplace. Buy, sell and learn about trading cards, coins, stamps and figurines.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {['𝕏', 'in', 'f'].map(icon => (
              <button key={icon} style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Marketplace column */}
        <div>
          <div style={{
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.75rem',
            fontSize: '0.9rem',
          }}>
            Marketplace
          </div>
          {[
            { label: 'Browse listings', path: '/browse' },
            { label: 'Sell an item', path: '/dashboard/seller' },
            { label: 'How it works', path: '/guides' },
          ].map(item => (
            <Link key={item.label} to={item.path} style={{
              display: 'block',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
            }}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Learn column */}
        <div>
          <div style={{
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.75rem',
            fontSize: '0.9rem',
          }}>
            Learn
          </div>
          {[
            { label: 'Guides', path: '/guides' },
            { label: 'Item database', path: '/database' },
            { label: 'AI Assistant', path: '/' },
          ].map(item => (
            <Link key={item.label} to={item.path} style={{
              display: 'block',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
            }}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Support column */}
        <div>
          <div style={{
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.75rem',
            fontSize: '0.9rem',
          }}>
            Support
          </div>
          {[
            { label: 'Contact us', path: '/support' },
            { label: 'FAQ', path: '/faq' },
            { label: 'Terms of service', path: '/terms' },
            { label: 'Privacy policy', path: '/privacy' },
          ].map(item => (
            <Link key={item.label} to={item.path} style={{
              display: 'block',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
            }}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: '1280px',
        margin: '2rem auto 0',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          © 2026 Koinpouch. All rights reserved.
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          Built for collectors, by collectors.
        </span>
      </div>
    </footer>
  )
}