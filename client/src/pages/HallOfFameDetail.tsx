import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ItemDetailData {
  id: string
  name: string
  headline: string | null
  description: string | null
  category: string
  origin_year: number | null
  manufacturer: string | null
  rarity: string | null
  tags: string[] | null
  story: string
  image_url: string | null
}

const tagColors: Record<string, string> = {
  holy_grail: '#eab308',
  production_error: '#f97316',
  controversial: '#ef4444',
  historically_significant: '#3b82f6',
  record_breaker: '#8b5cf6',
  urban_legend: '#06b6d4',
}

const tagLabels: Record<string, string> = {
  holy_grail: 'Holy Grail',
  production_error: 'Production Error',
  controversial: 'Controversial',
  historically_significant: 'Historically Significant',
  record_breaker: 'Record Breaker',
  urban_legend: 'Urban Legend',
}

const categoryEmoji: Record<string, string> = {
  cards: '🃏',
  figurines: '🗿',
  coins: '🪙',
  stamps: '✉️',
}

interface ContentBlock {
  type: 'heading' | 'paragraph'
  text: string
  html: string
}

function parseMarkdown(md: string): ContentBlock[] {
  const blocks = md.split(/\n\s*\n/).filter(Boolean)
  return blocks.map(block => {
    const trimmed = block.trim()
    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3)
      return { type: 'heading', text, html: text }
    }
    const html = trimmed
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
    return { type: 'paragraph', text: trimmed, html }
  })
}

export default function HallOfFameDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [item, setItem] = useState<ItemDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItem = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('catalog_items')
      .select('id, name, headline, description, category, origin_year, manufacturer, rarity, tags, story, image_url')
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (fetchError || !data) {
      setError('This story could not be found. It may have been moved or is not yet published.')
      setLoading(false)
      return
    }

    setItem(data as ItemDetailData)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItem()
  }, [fetchItem])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
          <div>Loading story...</div>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏆</div>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Story Not Found</div>
          <div style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error}</div>
          <button
            onClick={() => navigate('/hall-of-fame')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back to Hall of Fame
          </button>
        </div>
      </div>
    )
  }

  const blocks = parseMarkdown(item.story)
  const specRows = [
    { label: 'Category', value: item.category.charAt(0).toUpperCase() + item.category.slice(1) },
    { label: 'Origin Year', value: item.origin_year ? String(item.origin_year) : null },
    { label: 'Manufacturer', value: item.manufacturer },
    { label: 'Rarity', value: item.rarity },
  ].filter(row => row.value)

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: 'var(--color-text-muted)',
        flexWrap: 'wrap',
      }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link to="/hall-of-fame" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Hall of Fame</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{item.name}</span>
      </div>

      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        overflow: 'hidden',
        marginBottom: '2rem',
      }}>
        <div style={{
          height: '380px',
          backgroundColor: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8rem',
        }}>
          {item.image_url
            ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : categoryEmoji[item.category] ?? '🏆'
          }
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {(item.tags ?? []).map(tag => (
              <span key={tag} style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: tagColors[tag] ?? 'var(--color-primary)',
                padding: '4px 12px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {tagLabels[tag] ?? tag}
              </span>
            ))}
          </div>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginBottom: '0.75rem',
          }}>
            {item.headline ?? item.name}
          </h1>

          <div style={{
            fontSize: '1rem',
            color: 'var(--color-text-secondary)',
            fontWeight: 600,
            marginBottom: '1rem',
          }}>
            {item.name}
          </div>

          {item.description && (
            <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 260px',
        gap: '2.5rem',
        alignItems: 'flex-start',
      }}>

        <article style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
        }}>
          {blocks.map((block, idx) =>
            block.type === 'heading' ? (
              <h2
                key={idx}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.01em',
                  margin: idx === 0 ? '0 0 0.875rem' : '1.75rem 0 0.875rem',
                }}
              >
                {block.text}
              </h2>
            ) : (
              <p
                key={idx}
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.85,
                  margin: '0 0 1.1rem',
                }}
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            )
          )}

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <Link to="/hall-of-fame" style={{
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}>
              ← Back to Hall of Fame
            </Link>
            <Link to={`/browse?category=${item.category}`} style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}>
              Browse {item.category} →
            </Link>
          </div>
        </article>

        <aside style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {specRows.length > 0 && (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '14px',
              padding: '1.25rem',
            }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem',
              }}>
                At a Glance
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {specRows.map(row => (
                  <div key={row.label}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '1.25rem',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛒</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
              Hunting for one yourself?
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.875rem', lineHeight: 1.5 }}>
              Browse verified {item.category} listings on the marketplace.
            </div>
            <Link
              to={`/browse?category=${item.category}`}
              style={{
                display: 'block',
                padding: '9px',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              Browse {item.category} →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}