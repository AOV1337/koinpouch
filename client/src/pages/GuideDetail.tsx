import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface GuideContent {
  id: string
  slug: string
  title: string
  category: string
  topic: string | null
  author_name: string
  published_at: string | null
  read_time: number | null
  thumbnail_url: string | null
  content: string
}

const topicColors: Record<string, string> = {
  'Spotting Fakes': '#ef4444',
  'Grading & Condition': '#3b82f6',
  'Valuation': '#22c55e',
  'Storage & Care': '#8b5cf6',
  'Buying Tips': '#f97316',
  'Selling Tips': '#eab308',
  'Beginner Guides': '#06b6d4',
  'History & Context': '#ec4899',
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

export default function GuideDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [guide, setGuide] = useState<GuideContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGuide = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('guides')
      .select('id, slug, title, category, topic, published_at, read_time, thumbnail_url, content, profiles!guides_author_id_fkey(full_name)')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (fetchError || !data) {
      setError('This guide could not be found. It may have been moved or is not yet published.')
      setLoading(false)
      return
    }

    const raw = data as unknown as GuideContent & { profiles: { full_name: string | null }[] | { full_name: string | null } | null }
    const authorProfile = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles

    setGuide({
      ...raw,
      author_name: authorProfile?.full_name ?? 'Koinpouch Team',
    })
    setLoading(false)
  }, [slug])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGuide()
  }, [fetchGuide])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
          <div>Loading guide...</div>
        </div>
      </div>
    )
  }

  if (error || !guide) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📚</div>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Guide Not Found</div>
          <div style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error}</div>
          <button
            onClick={() => navigate('/guides')}
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
            Back to Guides
          </button>
        </div>
      </div>
    )
  }

  const blocks = parseMarkdown(guide.content)
  const headings = blocks.filter(b => b.type === 'heading')

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '2rem',
        fontSize: '0.875rem',
        color: 'var(--color-text-muted)',
        flexWrap: 'wrap',
      }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link to="/guides" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Guides</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{guide.title}</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 260px',
        gap: '2.5rem',
        alignItems: 'flex-start',
      }}>

        {/* Main article */}
        <article>

          {/* Header */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                flexShrink: 0,
              }}>
                {guide.thumbnail_url ?? '📚'}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {guide.topic && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#fff',
                    backgroundColor: topicColors[guide.topic] ?? 'var(--color-primary)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {guide.topic}
                  </span>
                )}
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary-light)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  textTransform: 'capitalize',
                }}>
                  {guide.category}
                </span>
              </div>
            </div>

            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}>
              {guide.title}
            </h1>

            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              <span>✍️ {guide.author_name}</span>
              {guide.published_at && (
                <span>📅 {new Date(guide.published_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              )}
              <span>⏱️ {guide.read_time ?? '—'} min read</span>
            </div>
          </div>

          {/* Content */}
          <div style={{
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
          </div>

          {/* Footer nav */}
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
            <Link to="/guides" style={{
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              ← Back to Guides
            </Link>
            <Link to="/browse" style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}>
              Browse Marketplace →
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <aside style={{
          position: 'sticky',
          top: '80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>

          {/* Table of contents */}
          {headings.length > 0 && (
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
                marginBottom: '0.875rem',
              }}>
                Contents
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {headings.map((h, idx) => (
                  <div key={idx} style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.4,
                    paddingLeft: '0.5rem',
                    borderLeft: '2px solid var(--color-border)',
                  }}>
                    {h.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related action */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '1.25rem',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛒</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
              Ready to buy?
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.875rem', lineHeight: 1.5 }}>
              Browse verified listings for {guide.category} on the marketplace.
            </div>
            <Link
              to={`/browse?category=${guide.category}`}
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
              Browse {guide.category} →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}