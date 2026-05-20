import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

interface Collection {
  id: string
  name: string
  category: string
  description: string
  item_count: number
  cover_emoji: string
  origin: string
  year_start: number
  year_end: number | null
}

const mockCollections: Collection[] = [
  {
    id: 'col-1',
    name: 'Pokémon Base Set 1999',
    category: 'cards',
    description: 'The original 102-card set that started the Pokémon TCG. Includes iconic holographic rares such as Charizard, Blastoise and Venusaur.',
    item_count: 102,
    cover_emoji: '🃏',
    origin: 'Japan / USA',
    year_start: 1999,
    year_end: null,
  },
  {
    id: 'col-2',
    name: 'Roman Imperial Coinage',
    category: 'coins',
    description: 'Coins minted during the Roman Imperial period, spanning from Augustus to the fall of the Western Empire.',
    item_count: 847,
    cover_emoji: '🪙',
    origin: 'Roman Empire',
    year_start: -27,
    year_end: 476,
  },
  {
    id: 'col-3',
    name: 'Great Britain Victorian Era Stamps',
    category: 'stamps',
    description: 'Stamps issued during the reign of Queen Victoria, including the iconic Penny Black — the world\'s first adhesive postage stamp.',
    item_count: 234,
    cover_emoji: '✉️',
    origin: 'United Kingdom',
    year_start: 1837,
    year_end: 1901,
  },
  {
    id: 'col-4',
    name: 'Neon Genesis Evangelion Figures',
    category: 'figurines',
    description: 'Official licensed figurines from the Neon Genesis Evangelion franchise, spanning multiple manufacturers and scales.',
    item_count: 89,
    cover_emoji: '🗿',
    origin: 'Japan',
    year_start: 1995,
    year_end: null,
  },
  {
    id: 'col-5',
    name: 'Pokémon Jungle Set 1999',
    category: 'cards',
    description: 'The second expansion set of the Pokémon TCG, featuring 64 cards and introducing new jungle-themed Pokémon.',
    item_count: 64,
    cover_emoji: '🃏',
    origin: 'Japan / USA',
    year_start: 1999,
    year_end: null,
  },
  {
    id: 'col-6',
    name: 'British Gold Sovereigns',
    category: 'coins',
    description: 'Gold sovereign coins minted by the Royal Mint, one of the most recognised and traded gold coins in the world.',
    item_count: 312,
    cover_emoji: '🪙',
    origin: 'United Kingdom',
    year_start: 1489,
    year_end: null,
  },
  {
    id: 'col-7',
    name: 'Penny Black & Early British Issues',
    category: 'stamps',
    description: 'The earliest stamps issued in Great Britain, including the Penny Black, Penny Red and Two Penny Blue.',
    item_count: 18,
    cover_emoji: '✉️',
    origin: 'United Kingdom',
    year_start: 1840,
    year_end: 1855,
  },
  {
    id: 'col-8',
    name: 'Dragon Ball Z Figurines — Banpresto',
    category: 'figurines',
    description: 'Official Banpresto figurines from the Dragon Ball Z universe, including the World Figure Colosseum and Dramatic Showcase series.',
    item_count: 156,
    cover_emoji: '🗿',
    origin: 'Japan',
    year_start: 1989,
    year_end: null,
  },
]

const categories = ['All', 'cards', 'coins', 'stamps', 'figurines']

const categoryMeta: Record<string, { label: string; emoji: string; color: string }> = {
  cards: { label: 'Trading Cards', emoji: '🃏', color: '#3b82f6' },
  coins: { label: 'Coins', emoji: '🪙', color: '#eab308' },
  stamps: { label: 'Stamps', emoji: '✉️', color: '#8b5cf6' },
  figurines: { label: 'Figurines', emoji: '🗿', color: '#f97316' },
}

const sortOptions = [
  { label: 'Most items', value: 'items_desc' },
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'A — Z', value: 'az' },
]

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`
  return `${year}`
}

export default function Database() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('items_desc')

  const filtered = useMemo(() => {
    let result = [...mockCollections]
    if (search) result = result.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.origin.toLowerCase().includes(search.toLowerCase())
    )
    if (selectedCategory !== 'All') result = result.filter(c => c.category === selectedCategory)
    if (sort === 'items_desc') result.sort((a, b) => b.item_count - a.item_count)
    if (sort === 'newest') result.sort((a, b) => b.year_start - a.year_start)
    if (sort === 'oldest') result.sort((a, b) => a.year_start - b.year_start)
    if (sort === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
    return result
  }, [search, selectedCategory, sort])

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
          Item Database
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          A curated reference catalogue of collectible items — objective information, no listings, no noise.
        </p>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '2rem',
      }}>
        {categories.map(cat => {
          const meta = categoryMeta[cat]
          const isActive = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '8px 18px',
                borderRadius: '999px',
                border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textTransform: 'capitalize',
              }}
            >
              {meta ? `${meta.emoji} ${meta.label}` : '🗂️ All Collections'}
            </button>
          )
        })}
      </div>

      {/* Search and sort */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search collections, origins..."
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

      {/* Results count */}
      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontWeight: 500 }}>
        {filtered.length} collection{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* Collections grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {filtered.map(collection => {
            const meta = categoryMeta[collection.category]
            return (
              <Link
                key={collection.id}
                to={`/database/${collection.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-4px)'
                    el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  {/* Cover */}
                  <div style={{
                    height: '120px',
                    backgroundColor: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    position: 'relative',
                  }}>
                    {collection.cover_emoji}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: meta?.color ?? 'var(--color-primary)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      textTransform: 'capitalize',
                    }}>
                      {meta?.emoji} {meta?.label ?? collection.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h2 style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.3,
                      margin: 0,
                    }}>
                      {collection.name}
                    </h2>

                    <p style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.6,
                      margin: 0,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    } as React.CSSProperties}>
                      {collection.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.5rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--color-border)',
                    }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          📍 {collection.origin}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          📅 {formatYear(collection.year_start)}{collection.year_end ? ` — ${formatYear(collection.year_end)}` : '+'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        backgroundColor: 'var(--color-primary-light)',
                        padding: '3px 10px',
                        borderRadius: '999px',
                      }}>
                        {collection.item_count} items
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗄️</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            No collections found
          </div>
          <div style={{ fontSize: '0.9rem' }}>Try adjusting your search or category filter</div>
        </div>
      )}
    </div>
  )
}