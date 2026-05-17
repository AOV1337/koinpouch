import { Link } from 'react-router-dom'

const categories = [
  { label: 'Trading Cards', emoji: '🃏', path: '/browse?category=cards' },
  { label: 'Figurines', emoji: '🗿', path: '/browse?category=figurines' },
  { label: 'Coins', emoji: '🪙', path: '/browse?category=coins' },
  { label: 'Stamps', emoji: '✉️', path: '/browse?category=stamps' },
]

const features = [
  {
    icon: '✅',
    title: 'Verified Sellers',
    description: 'Every seller goes through KYC verification and builds a transparent reputation score visible to all buyers.',
  },
  {
    icon: '📚',
    title: 'Knowledge Hub',
    description: 'Guides on spotting fakes, understanding grading, and item databases with objective details for every category.',
  },
  {
    icon: '🔒',
    title: 'Secure Payments',
    description: 'All transactions are processed securely through Stripe. Your money is protected at every step.',
  },
  {
    icon: '🤖',
    title: 'AI Companion',
    description: 'Ask our collector\'s assistant anything — from grading terminology to what to look for when buying.',
  },
]

const mockListings = [
  { id: '1', title: 'Charizard Holo 1st Edition', category: 'Trading Cards', price: '€1,200', condition: 'Near Mint', emoji: '🃏' },
  { id: '2', title: 'Roman Denarius — Julius Caesar', category: 'Coins', price: '€340', condition: 'Good', emoji: '🪙' },
  { id: '3', title: 'Penny Black 1840 — Used', category: 'Stamps', price: '€890', condition: 'Fair', emoji: '✉️' },
  { id: '4', title: 'Evangelion Unit-01 — Kotobukiya', category: 'Figurines', price: '€210', condition: 'Mint', emoji: '🗿' },
]

export default function Home() {
  return (
    <div style={{ backgroundColor: 'var(--color-background)' }}>

      {/* Hero */}
      <section style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '5rem 1.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.5rem',
      }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          padding: '6px 16px',
          borderRadius: '999px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
        }}>
          The collector's marketplace
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 900,
          color: 'var(--color-text-primary)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          maxWidth: '700px',
        }}>
          Buy, sell and <span style={{ color: 'var(--color-primary)' }}>learn</span> about what you collect
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '540px',
          lineHeight: 1.7,
        }}>
          Koinpouch brings together a trusted marketplace and a knowledge hub for trading cards, coins, stamps and figurines — all in one place.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/browse" style={{
            padding: '14px 28px',
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            transition: 'opacity 0.15s ease',
          }}>
            Browse Market
          </Link>
          <Link to="/database" style={{
            padding: '14px 28px',
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            border: '1px solid var(--color-border)',
          }}>
            Explore Database
          </Link>
        </div>
      </section>

      {/* Categories bar */}
      <section style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1.5rem',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          {categories.map(cat => (
            <Link key={cat.label} to={cat.path} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '10px 24px',
              borderRadius: '999px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'border-color 0.15s ease, color 0.15s ease',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.color = 'var(--color-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      <section style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '4rem 1.5rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Featured listings
          </h2>
          <Link to="/browse" style={{
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}>
            View all →
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}>
          {mockListings.map(listing => (
            <Link key={listing.id} to={`/item/${listing.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                overflow: 'hidden',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                }}
              >
                {/* Image placeholder */}
                <div style={{
                  height: '180px',
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                }}>
                  {listing.emoji}
                </div>

                <div style={{ padding: '1rem' }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {listing.category}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                  }}>
                    {listing.title}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--color-primary)',
                    }}>
                      {listing.price}
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                      backgroundColor: 'var(--color-background)',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      border: '1px solid var(--color-border)',
                    }}>
                      {listing.condition}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Koinpouch */}
      <section style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '4rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
            textAlign: 'center',
          }}>
            Why Koinpouch?
          </h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            marginBottom: '2.5rem',
            fontSize: '1rem',
          }}>
            More than a marketplace — a complete environment for collectors.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.25rem',
          }}>
            {features.map(feature => (
              <div key={feature.title} style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '1.5rem',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{feature.icon}</div>
                <div style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.5rem',
                }}>
                  {feature.title}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                }}>
                  {feature.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge hub teaser */}
      <section style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '4rem 1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}>
        {[
          {
            title: 'Collector\'s Guides',
            description: 'Learn how to spot fakes, understand grading systems and know what makes an item valuable across all four categories.',
            cta: 'Read guides',
            path: '/guides',
            icon: '📖',
          },
          {
            title: 'Item Database',
            description: 'Browse our curated database of collectible items with objective details, historical context and reference images.',
            cta: 'Explore database',
            path: '/database',
            icon: '🗄️',
          },
        ].map(card => (
          <div key={card.title} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{ fontSize: '2.5rem' }}>{card.icon}</div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
            }}>
              {card.title}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              flex: 1,
            }}>
              {card.description}
            </div>
            <Link to={card.path} style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              alignSelf: 'flex-start',
            }}>
              {card.cta} →
            </Link>
          </div>
        ))}
      </section>

      {/* AI Assistant teaser */}
      <section style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '4rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{ fontSize: '3rem' }}>🤖</div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Meet your collector's companion
          </h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '1rem',
            lineHeight: 1.7,
          }}>
            Not sure what to look for? Ask our AI assistant about grading, authenticity, history or value. It won't replace an expert — but it's always available.
          </p>
          <button style={{
            padding: '12px 28px',
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
          }}>
            Try the assistant →
          </button>
        </div>
      </section>

    </div>
  )
}