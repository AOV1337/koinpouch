import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Item {
  id: string
  name: string
  headline: string | null
  description: string | null
  category: string
  tags: string[] | null
  image_url: string | null
  featured: boolean
  published_at: string | null
  created_at: string
}

const TAG_OPTIONS = [
  { value: 'holy_grail', label: 'Holy Grails', color: '#eab308' },
  { value: 'production_error', label: 'Production Errors', color: '#f97316' },
  { value: 'controversial', label: 'Controversial', color: '#ef4444' },
  { value: 'historically_significant', label: 'Historically Significant', color: '#3b82f6' },
  { value: 'record_breaker', label: 'Record Breakers', color: '#8b5cf6' },
  { value: 'urban_legend', label: 'Urban Legends', color: '#06b6d4' },
]

const tagColors: Record<string, string> = Object.fromEntries(TAG_OPTIONS.map(t => [t.value, t.color]))
const tagLabels: Record<string, string> = Object.fromEntries(TAG_OPTIONS.map(t => [t.value, t.label]))

const categoryEmoji: Record<string, string> = {
  cards: '🃏',
  figurines: '🗿',
  coins: '🪙',
  stamps: '✉️',
}

const itemTypes = ['All', 'cards', 'coins', 'stamps', 'figurines']

function ItemCard({ item, large }: { item: Item; large?: boolean }) {
  return (
    <Link to={`/hall-of-fame/${item.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        }}
      >
        <div style={{
          height: large ? '340px' : '180px',
          backgroundColor: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: large ? '6rem' : '3rem',
          position: 'relative',
          flexShrink: 0,
        }}>
          {item.image_url
            ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : categoryEmoji[item.category] ?? '🏆'
          }
          {item.featured && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
            }}>
              ⭐ Featured
            </div>
          )}
        </div>

        <div style={{ padding: large ? '1.5rem' : '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {(item.tags ?? []).slice(0, large ? 3 : 2).map(tag => (
              <span key={tag} style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: tagColors[tag] ?? 'var(--color-primary)',
                padding: '2px 8px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}>
                {tagLabels[tag] ?? tag}
              </span>
            ))}
          </div>

          <h3 style={{
            fontSize: large ? '1.35rem' : '1rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
            margin: 0,
          }}>
            {item.headline ?? item.name}
          </h3>

          {large && item.description && (
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {item.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function HallOfFame() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState('All')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('catalog_items')
      .select('id, name, headline, description, category, tags, image_url, featured, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setItems(data as Item[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems()
  }, [fetchItems])

  const filtered = useMemo(() => {
    let result = [...items]
    if (selectedTag) result = result.filter(i => (i.tags ?? []).includes(selectedTag))
    if (selectedType !== 'All') result = result.filter(i => i.category === selectedType)
    return result
  }, [items, selectedTag, selectedType])

  // Featured item gets the big hero slot — prefer an explicitly featured item,
  // fall back to the most recent if none are marked featured.
  const heroItem = filtered.find(i => i.featured) ?? filtered[0] ?? null
  const restItems = filtered.filter(i => i.id !== heroItem?.id)

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
          🏆 Hall of Fame
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          The most remarkable, controversial and legendary items in collecting history — curated stories worth knowing.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedTag(null)}
            style={{
              padding: '7px 16px',
              borderRadius: '999px',
              border: `2px solid ${selectedTag === null ? 'var(--color-primary)' : 'var(--color-border)'}`,
              backgroundColor: selectedTag === null ? 'var(--color-primary-light)' : 'var(--color-surface)',
              color: selectedTag === null ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: selectedTag === null ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            All Stories
          </button>
          {TAG_OPTIONS.map(tag => (
            <button
              key={tag.value}
              onClick={() => setSelectedTag(prev => prev === tag.value ? null : tag.value)}
              style={{
                padding: '7px 16px',
                borderRadius: '999px',
                border: `2px solid ${selectedTag === tag.value ? tag.color : 'var(--color-border)'}`,
                backgroundColor: selectedTag === tag.value ? `${tag.color}18` : 'var(--color-surface)',
                color: selectedTag === tag.value ? tag.color : 'var(--color-text-secondary)',
                fontWeight: selectedTag === tag.value ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {itemTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                padding: '5px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: selectedType === type ? 'var(--color-primary)' : 'transparent',
                color: selectedType === type ? '#fff' : 'var(--color-text-muted)',
                fontWeight: selectedType === type ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {type === 'All' ? 'All Categories' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
          Loading stories...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            No stories found
          </div>
          <div style={{ fontSize: '0.9rem' }}>Try a different filter</div>
        </div>
      ) : (
        <>
          {/* Hero slot */}
          {heroItem && (
            <div style={{ marginBottom: '1.5rem' }}>
              <ItemCard item={heroItem} large />
            </div>
          )}

          {/* Remaining items — flowing grid */}
          {restItems.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}>
              {restItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}