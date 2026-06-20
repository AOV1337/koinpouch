import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { OPEN_CHAT_WIDGET_EVENT } from '../components/ChatWidget'
import { supabase } from '../lib/supabase'
import { CATEGORY_META, CONDITION_META, type ListingCategory, type ListingCondition } from '../lib/listingMeta'

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

const assistantPrompts = [
  '🔍 Spot a fake',
  '🪙 Grading basics',
  "💎 What's it worth?",
]

interface ListingRow {
  id: string
  title: string
  price: number
  currency: string
  category: string
  condition: string
  images: unknown
}

interface HallOfFameRow {
  id: string
  name: string
  headline: string | null
  tags: string[] | null
  image_url: string | null
  featured: boolean
}

interface GuideRow {
  id: string
  slug: string
  title: string
  excerpt: string | null
  topic: string | null
  thumbnail_url: string | null
  read_time: number
}

// images is JSONB and its exact shape isn't confirmed from this file alone —
// handles both a plain array of URL strings and an array of {url} objects.
function getListingImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null
  const first = images[0]
  if (typeof first === 'string') return first
  if (first && typeof first === 'object' && 'url' in (first as Record<string, unknown>)) {
    const url = (first as { url?: unknown }).url
    return typeof url === 'string' ? url : null
  }
  return null
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'EUR' }).format(price)
  } catch {
    return `${price} ${currency}`
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function Home() {
  const [listings, setListings] = useState<ListingRow[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [hofItems, setHofItems] = useState<HallOfFameRow[]>([])
  const [hofLoading, setHofLoading] = useState(true)
  const [randomGuide, setRandomGuide] = useState<GuideRow | null>(null)
  const [guideLoading, setGuideLoading] = useState(true)

  // No `featured` flag exists on listings (only catalog_items has one), so
  // this pulls the most recent active listings and shuffles client-side
  // rather than true curated featuring.
  const fetchFeaturedListings = useCallback(async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, price, currency, category, condition, images')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(24)

    if (!error && data) {
      setListings(shuffle(data as ListingRow[]).slice(0, 4))
    }
    setListingsLoading(false)
  }, [])

  const fetchHallOfFame = useCallback(async () => {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('id, name, headline, tags, image_url, featured')
      .eq('is_published', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3)

    if (!error && data) {
      setHofItems(data as HallOfFameRow[])
    }
    setHofLoading(false)
  }, [])

  // Picks one random published guide as a teaser example, same
  // fetch-recent-then-shuffle approach used for featured listings since
  // there's no random ordering available through the query builder.
  const fetchRandomGuide = useCallback(async () => {
    const { data, error } = await supabase
      .from('guides')
      .select('id, slug, title, excerpt, topic, thumbnail_url, read_time')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(10)

    if (!error && data && data.length > 0) {
      setRandomGuide(shuffle(data as GuideRow[])[0])
    }
    setGuideLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFeaturedListings()
    fetchHallOfFame()
    fetchRandomGuide()
  }, [fetchFeaturedListings, fetchHallOfFame, fetchRandomGuide])

  function handleOpenAssistant() {
    window.dispatchEvent(new Event(OPEN_CHAT_WIDGET_EVENT))
  }

  return (
    <div style={{ backgroundColor: 'var(--color-background)' }}>

      <style>{`
        @keyframes kp-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .kp-skeleton { animation: kp-pulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .kp-skeleton { animation: none; }
        }
      `}</style>

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
          <Link to="/guides" style={{
            padding: '14px 28px',
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            border: '1px solid var(--color-border)',
          }}>
            Guides
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

        {listingsLoading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="kp-skeleton" style={{
                height: '300px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
              }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-muted)',
            border: '1px dashed var(--color-border)',
            borderRadius: '14px',
          }}>
            No active listings yet — check back soon.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}>
            {listings.map(listing => {
              const imgUrl = getListingImageUrl(listing.images)
              const meta = CATEGORY_META[listing.category as ListingCategory]
              return (
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
                    <div style={{
                      height: '180px',
                      backgroundColor: 'var(--color-primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '4rem',
                      overflow: 'hidden',
                    }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{meta?.emoji ?? '📦'}</span>
                      )}
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
                        {meta?.label ?? listing.category}
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
                          {formatPrice(listing.price, listing.currency)}
                        </span>
                        <span style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-text-muted)',
                          backgroundColor: 'var(--color-background)',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          border: '1px solid var(--color-border)',
                        }}>
                          {CONDITION_META[listing.condition as ListingCondition]?.label ?? listing.condition}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Why Koinpouch */}
      <section style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '4rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}>
            {features.map(feature => (
              <div key={feature.title} style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '1.75rem 1.5rem',
                textAlign: 'center',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  margin: '0 auto 1rem',
                }}>
                  {feature.icon}
                </div>
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

      {/* Guides teaser */}
      <section style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '4rem 1.5rem',
      }}>
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '2.5rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: '3rem' }}>📖</div>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--color-text-primary)',
                marginBottom: '0.5rem',
              }}>
                Collector's Guides
              </div>
              <div style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
              }}>
                Learn how to spot fakes, understand grading systems and know what makes an item valuable across all four categories.
              </div>
            </div>
            <Link to="/guides" style={{
              padding: '12px 24px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
            }}>
              Read guides →
            </Link>
          </div>

          {!guideLoading && randomGuide && (
            <div style={{
              marginTop: '1.75rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
                From the guides
              </span>
              <Link to={`/guides/${randomGuide.slug}`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none',
                flex: 1,
                minWidth: '220px',
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  flexShrink: 0,
                }}>
                  {randomGuide.thumbnail_url ?? '📖'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {randomGuide.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    {randomGuide.read_time} min read{randomGuide.topic ? ` · ${randomGuide.topic}` : ''}
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Hall of Fame */}
      <section style={{
        background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '4.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
            }}>
              Hall of Fame
            </h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: '1rem',
              maxWidth: '520px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}>
              The most remarkable, controversial and legendary items in collecting history — and the stories behind them.
            </p>
          </div>

          {hofLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="kp-skeleton" style={{
                  height: '320px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                }} />
              ))}
            </div>
          ) : hofItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Stories coming soon.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {hofItems.map(item => (
                <Link key={item.id} to={`/hall-of-fame/${item.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 14px 34px rgba(0,0,0,0.12)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ height: '200px', position: 'relative', backgroundColor: 'var(--color-primary-light)', overflow: 'hidden' }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                          🏆
                        </div>
                      )}
                      {item.featured && (
                        <span style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          backgroundColor: 'var(--color-primary)',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                        }}>
                          Featured
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      {item.headline && (
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.4 }}>
                          {item.headline}
                        </div>
                      )}
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {item.name}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.5rem' }}>
                          {item.tags.slice(0, 2).map(tag => (
                            <span key={tag} style={{
                              fontSize: '0.7rem',
                              color: 'var(--color-text-muted)',
                              backgroundColor: 'var(--color-background)',
                              border: '1px solid var(--color-border)',
                              padding: '2px 8px',
                              borderRadius: '999px',
                            }}>
                              {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/hall-of-fame" style={{
              display: 'inline-block',
              padding: '12px 28px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}>
              Explore the full Hall of Fame →
            </Link>
          </div>
        </div>
      </section>

      {/* AI Assistant teaser — closing section */}
      <section style={{
        backgroundColor: 'var(--color-surface)',
        padding: '4.5rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}>
          {/* Mock chat preview — gives the section something tangible to look at instead of just an emoji */}
          <div style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '14px 14px 2px 14px',
                fontSize: '0.8rem',
                maxWidth: '85%',
              }}>
                Is this 1955 doubled die cent real?
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                padding: '8px 14px',
                borderRadius: '14px 14px 14px 2px',
                fontSize: '0.8rem',
                maxWidth: '88%',
                border: '1px solid var(--color-border)',
              }}>
                Check the doubling on "LIBERTY" and the date — here's what to look for…
              </div>
            </div>
          </div>

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

          {/* Example prompts — each just opens the assistant, same as the main CTA */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {assistantPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={handleOpenAssistant}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.color = 'var(--color-primary)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.color = 'var(--color-text-secondary)'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenAssistant}
            style={{
              padding: '12px 28px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Try the assistant →
          </button>
        </div>
      </section>

    </div>
  )
}