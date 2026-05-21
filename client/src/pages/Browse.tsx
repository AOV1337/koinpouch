import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'
import type { Listing } from '../components/ListingCard'

const categories = ['All', 'cards', 'coins', 'stamps', 'figurines']
const conditions = ['All', 'mint', 'near_mint', 'good', 'fair', 'poor']
const sortOptions = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

export default function Browse() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedCondition, setSelectedCondition] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setListings((data as Listing[]) ?? [])
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load listings')
        } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  const filtered = useMemo(() => {
    let result = [...listings]

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
  }, [listings, search, selectedCategory, selectedCondition, minPrice, maxPrice, sort])

  const filterLabelStyle = {
    fontSize: '0.8rem',
    fontWeight: 700 as const,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    display: 'block' as const,
  }

  const filterSectionStyle = {
    marginBottom: '1.5rem',
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
    fontSize: '0.9rem',
    cursor: 'pointer' as const,
    textTransform: 'capitalize' as const,
  })

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
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>
          Filters
        </div>

        {/* Category */}
        <div style={filterSectionStyle}>
          <span style={filterLabelStyle}>Category</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={filterBtnStyle(selectedCategory === cat)}
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
              style={filterBtnStyle(selectedCondition === cond)}
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
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
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

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
            <div style={{ fontSize: '0.95rem' }}>Loading listings...</div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
          }}>
            Failed to load listings: {error}
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontWeight: 500 }}>
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
            </div>

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
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  No listings found
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  {listings.length === 0 ? 'No listings have been posted yet.' : 'Try adjusting your filters or search term'}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}