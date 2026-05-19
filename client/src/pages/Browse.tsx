import { useState, useMemo } from 'react'
import ListingCard from '../components/ListingCard'
import type { Listing } from '../components/ListingCard'

const mockListings: Listing[] = [
  { id: '1', title: 'Charizard Holo 1st Edition', price: 1200, currency: '€', category: 'cards', condition: 'near_mint', images: null, seller_id: 'mock', created_at: '2026-01-01' },
  { id: '2', title: 'Roman Denarius — Julius Caesar', price: 340, currency: '€', category: 'coins', condition: 'good', images: null, seller_id: 'mock', created_at: '2026-01-02' },
  { id: '3', title: 'Penny Black 1840 — Used', price: 890, currency: '€', category: 'stamps', condition: 'fair', images: null, seller_id: 'mock', created_at: '2026-01-03' },
  { id: '4', title: 'Evangelion Unit-01 — Kotobukiya', price: 210, currency: '€', category: 'figurines', condition: 'mint', images: null, seller_id: 'mock', created_at: '2026-01-04' },
  { id: '5', title: 'Pikachu Illustrator Card', price: 4500, currency: '€', category: 'cards', condition: 'mint', images: null, seller_id: 'mock', created_at: '2026-01-05' },
  { id: '6', title: 'Gold Sovereign — Queen Victoria', price: 520, currency: '€', category: 'coins', condition: 'near_mint', images: null, seller_id: 'mock', created_at: '2026-01-06' },
  { id: '7', title: 'Blue Mauritius 1847', price: 2100, currency: '€', category: 'stamps', condition: 'good', images: null, seller_id: 'mock', created_at: '2026-01-07' },
  { id: '8', title: 'Guts Berserker Armor — Art of War', price: 380, currency: '€', category: 'figurines', condition: 'mint', images: null, seller_id: 'mock', created_at: '2026-01-08' },
]

const categories = ['All', 'cards', 'coins', 'stamps', 'figurines']
const conditions = ['All', 'mint', 'near_mint', 'good', 'fair', 'poor']
const sortOptions = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

export default function Browse() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedCondition, setSelectedCondition] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')

  const filtered = useMemo(() => {
    let result = [...mockListings]

    if (search) {
      result = result.filter(l =>
        l.title.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (selectedCategory !== 'All') {
      result = result.filter(l => l.category === selectedCategory)
    }
    if (selectedCondition !== 'All') {
      result = result.filter(l => l.condition === selectedCondition)
    }
    if (minPrice) {
      result = result.filter(l => l.price >= parseFloat(minPrice))
    }
    if (maxPrice) {
      result = result.filter(l => l.price <= parseFloat(maxPrice))
    }
    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') result.sort((a, b) => b.price - a.price)
    if (sort === 'newest') result.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return result
  }, [search, selectedCategory, selectedCondition, minPrice, maxPrice, sort])

  const filterLabelStyle = {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    display: 'block' as const,
  }

  const filterSectionStyle = {
    marginBottom: '1.5rem',
  }

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
      display: 'flex',
      gap: '2rem',
      alignItems: 'flex-start',
    }}>

      {/* Filter sidebar */}
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
        <div style={{
          fontWeight: 800,
          fontSize: '1rem',
          color: 'var(--color-text-primary)',
          marginBottom: '1.5rem',
        }}>
          Filters
        </div>

        {/* Category */}
        <div style={filterSectionStyle}>
          <span style={filterLabelStyle}>Category</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 10px',
                marginBottom: '2px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: selectedCategory === cat ? 'var(--color-primary-light)' : 'transparent',
                color: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: selectedCategory === cat ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Condition */}
        <div style={filterSectionStyle}>
          <span style={filterLabelStyle}>Condition</span>
          {conditions.map(cond => (
            <button
              key={cond}
              onClick={() => setSelectedCondition(cond)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 10px',
                marginBottom: '2px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: selectedCondition === cond ? 'var(--color-primary-light)' : 'transparent',
                color: selectedCondition === cond ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: selectedCondition === cond ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {cond === 'All' ? 'All Conditions' : cond.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Price range */}
        <div style={filterSectionStyle}>
          <span style={filterLabelStyle}>Price Range (€)</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setSelectedCategory('All')
            setSelectedCondition('All')
            setMinPrice('')
            setMaxPrice('')
            setSearch('')
            setSort('newest')
          }}
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

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Search and sort bar */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="Search listings..."
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
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          marginBottom: '1.25rem',
          fontWeight: 500,
        }}>
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}>
            {filtered.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '4rem 0',
            color: 'var(--color-text-muted)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
              No listings found
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              Try adjusting your filters or search term
            </div>
          </div>
        )}
      </div>
    </div>
  )
}