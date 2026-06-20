import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Guide {
  id: string
  slug: string
  title: string
  excerpt: string | null
  category: string
  topic: string | null
  thumbnail_url: string | null
  author_name: string | null
  published_at: string | null
  read_time: number | null
}

const itemTypes = ['All', 'cards', 'coins', 'stamps', 'figurines', 'general']
const topics = ['All', 'Spotting Fakes', 'Grading & Condition', 'Valuation', 'Storage & Care', 'Buying Tips', 'Selling Tips', 'Beginner Guides', 'History & Context']
const sortOptions = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'A — Z', value: 'az' },
]

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

export default function Guides() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [sort, setSort] = useState('newest')

  const fetchGuides = useCallback(async () => {
    setLoading(true)

    // Join author name via profiles. Published guides are publicly readable per RLS.
    const { data, error } = await supabase
      .from('guides')
      .select('id, slug, title, excerpt, category, topic, thumbnail_url, published_at, read_time, profiles!guides_author_id_fkey(full_name)')
      .eq('is_published', true)

    if (!error && data) {
      const mapped = (data as unknown as (Guide & { profiles: { full_name: string | null }[] | { full_name: string | null } | null })[]).map(g => {
        const authorProfile = Array.isArray(g.profiles) ? g.profiles[0] : g.profiles
        return {
          ...g,
          author_name: authorProfile?.full_name ?? 'Koinpouch Team',
        }
      })
      setGuides(mapped)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGuides()
  }, [fetchGuides])

  const filtered = useMemo(() => {
    let result = [...guides]
    if (search) result = result.filter(g =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      (g.excerpt ?? '').toLowerCase().includes(search.toLowerCase())
    )
    if (selectedType !== 'All') result = result.filter(g => g.category === selectedType)
    if (selectedTopic !== 'All') result = result.filter(g => g.topic === selectedTopic)
    if (sort === 'newest') result.sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
    if (sort === 'oldest') result.sort((a, b) => new Date(a.published_at ?? 0).getTime() - new Date(b.published_at ?? 0).getTime())
    if (sort === 'az') result.sort((a, b) => a.title.localeCompare(b.title))
    return result
  }, [guides, search, selectedType, selectedTopic, sort])

  const filterLabelStyle = {
    fontSize: '0.8rem',
    fontWeight: 700 as const,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    display: 'block' as const,
  }

  const filterBtnStyle = (active: boolean) => ({
    display: 'block' as const,
    width: '100%',
    textAlign: 'left' as const,
    padding: '6px 10px',
    marginBottom: '2px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: active ? 'var(--color-primary-light)' : 'transparent',
    color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    fontWeight: active ? 700 : 500,
    fontSize: '0.875rem',
    cursor: 'pointer' as const,
    textTransform: 'capitalize' as const,
  })

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
        }}>
          Collector's Guides
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          Expert knowledge on spotting fakes, grading, valuation and more — for every category we support.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

        <aside style={{
          width: '220px',
          flexShrink: 0,
          position: 'sticky',
          top: '80px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          padding: '1.5rem',
        }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>
            Filters
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <span style={filterLabelStyle}>Item Type</span>
            {itemTypes.map(type => (
              <button key={type} onClick={() => setSelectedType(type)} style={filterBtnStyle(selectedType === type)}>
                {type === 'All' ? 'All Types' : type}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <span style={filterLabelStyle}>Topic</span>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                style={{
                  ...filterBtnStyle(selectedTopic === topic),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {topic !== 'All' && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: topicColors[topic] ?? 'var(--color-text-muted)',
                    flexShrink: 0,
                  }} />
                )}
                {topic === 'All' ? 'All Topics' : topic}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setSelectedType('All'); setSelectedTopic('All'); setSearch(''); setSort('newest') }}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Reset filters
          </button>
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Search guides..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontWeight: 500 }}>
            {loading ? 'Loading…' : `${filtered.length} guide${filtered.length !== 1 ? 's' : ''} found`}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
              Loading guides...
            </div>
          ) : filtered.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map(guide => (
                <Link key={guide.id} to={`/guides/${guide.slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '14px',
                      padding: '1.5rem',
                      display: 'flex',
                      gap: '1.25rem',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderColor = 'var(--color-primary)'
                      el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderColor = 'var(--color-border)'
                      el.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--color-primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      flexShrink: 0,
                    }}>
                      {guide.thumbnail_url ?? '📚'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem', alignItems: 'center' }}>
                        {guide.topic && (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#fff',
                            backgroundColor: topicColors[guide.topic] ?? 'var(--color-primary)',
                            padding: '2px 8px',
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
                          padding: '2px 8px',
                          borderRadius: '999px',
                          textTransform: 'capitalize',
                        }}>
                          {guide.category}
                        </span>
                      </div>

                      <h2 style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        marginBottom: '0.4rem',
                        lineHeight: 1.3,
                      }}>
                        {guide.title}
                      </h2>

                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.6,
                        marginBottom: '0.75rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      } as React.CSSProperties}>
                        {guide.excerpt}
                      </p>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <span>✍️ {guide.author_name}</span>
                        {guide.published_at && (
                          <span>📅 {new Date(guide.published_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        )}
                        <span>⏱️ {guide.read_time ?? '—'} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                No guides found
              </div>
              <div style={{ fontSize: '0.9rem' }}>Try adjusting your filters or search term</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}