import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

interface Guide {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  topic: string
  thumbnail_emoji: string
  author: string
  published_at: string
  read_time: number
}

const mockGuides: Guide[] = [
  {
    id: '1', slug: 'how-to-spot-fake-pokemon-cards',
    title: 'How to Spot Fake Pokémon Cards',
    excerpt: 'Learn the key visual and physical tells that separate genuine Pokémon cards from counterfeits, including light tests, texture checks and print quality analysis.',
    category: 'cards', topic: 'Spotting Fakes', thumbnail_emoji: '🃏',
    author: 'Koinpouch Team', published_at: '2026-04-10', read_time: 8,
  },
  {
    id: '2', slug: 'understanding-coin-grading',
    title: 'Understanding Coin Grading: The Sheldon Scale',
    excerpt: 'A complete breakdown of the 70-point Sheldon scale used by PCGS and NGC to grade coins, with visual examples for each major grade tier.',
    category: 'coins', topic: 'Grading & Condition', thumbnail_emoji: '🪙',
    author: 'Koinpouch Team', published_at: '2026-04-05', read_time: 12,
  },
  {
    id: '3', slug: 'stamp-valuation-guide',
    title: 'What Makes a Stamp Valuable?',
    excerpt: 'From printing errors to historical significance — the factors that drive stamp valuations and how to assess what your collection might be worth.',
    category: 'stamps', topic: 'Valuation', thumbnail_emoji: '✉️',
    author: 'Koinpouch Team', published_at: '2026-03-28', read_time: 10,
  },
  {
    id: '4', slug: 'storing-figurines-correctly',
    title: 'How to Store and Display Figurines Without Damage',
    excerpt: 'UV exposure, humidity, dust — the silent enemies of your figurine collection. A practical guide to long-term preservation and display.',
    category: 'figurines', topic: 'Storage & Care', thumbnail_emoji: '🗿',
    author: 'Koinpouch Team', published_at: '2026-03-20', read_time: 6,
  },
  {
    id: '5', slug: 'beginners-guide-to-collecting',
    title: "The Beginner's Guide to Collecting",
    excerpt: 'Just starting out? This guide covers the fundamentals every new collector should know — from choosing a focus to avoiding common beginner mistakes.',
    category: 'general', topic: 'Beginner Guides', thumbnail_emoji: '📚',
    author: 'Koinpouch Team', published_at: '2026-03-15', read_time: 15,
  },
  {
    id: '6', slug: 'buying-cards-on-marketplaces',
    title: 'Buying Trading Cards on Online Marketplaces Safely',
    excerpt: 'Red flags to watch for, questions to ask sellers, and how to protect yourself when buying high-value cards online.',
    category: 'cards', topic: 'Buying Tips', thumbnail_emoji: '🃏',
    author: 'Koinpouch Team', published_at: '2026-03-08', read_time: 9,
  },
  {
    id: '7', slug: 'history-of-penny-black',
    title: "The Penny Black: History of the World's First Stamp",
    excerpt: 'The story behind the 1840 Penny Black — why it was created, how it changed global communication, and why collectors still pursue it today.',
    category: 'stamps', topic: 'History & Context', thumbnail_emoji: '✉️',
    author: 'Koinpouch Team', published_at: '2026-02-28', read_time: 7,
  },
  {
    id: '8', slug: 'photographing-collectibles',
    title: 'How to Photograph Your Collectibles for Sale',
    excerpt: 'Good photos sell items faster and at better prices. A practical guide to lighting, angles, backgrounds and equipment for collectible photography.',
    category: 'general', topic: 'Selling Tips', thumbnail_emoji: '📸',
    author: 'Koinpouch Team', published_at: '2026-02-15', read_time: 8,
  },
]

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
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [sort, setSort] = useState('newest')

  const filtered = useMemo(() => {
    let result = [...mockGuides]
    if (search) result = result.filter(g =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.excerpt.toLowerCase().includes(search.toLowerCase())
    )
    if (selectedType !== 'All') result = result.filter(g => g.category === selectedType)
    if (selectedTopic !== 'All') result = result.filter(g => g.topic === selectedTopic)
    if (sort === 'newest') result.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    if (sort === 'oldest') result.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime())
    if (sort === 'az') result.sort((a, b) => a.title.localeCompare(b.title))
    return result
  }, [search, selectedType, selectedTopic, sort])

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
              <button key={topic} onClick={() => setSelectedTopic(topic)} style={filterBtnStyle(selectedTopic === topic)}>
                {topic}
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
            {filtered.length} guide{filtered.length !== 1 ? 's' : ''} found
          </div>

          {filtered.length > 0 ? (
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
                      {guide.thumbnail_emoji}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem', alignItems: 'center' }}>
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
                        <span>✍️ {guide.author}</span>
                        <span>📅 {new Date(guide.published_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <span>⏱️ {guide.read_time} min read</span>
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