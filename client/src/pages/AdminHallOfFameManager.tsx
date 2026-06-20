import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { supabase } from '../lib/supabase'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/admin', icon: '📊' },
  { label: 'KYC Review', path: '/dashboard/admin/kyc-requests', icon: '🪪' },
  { label: 'Support Tickets', path: '/dashboard/admin/tickets', icon: '🎧' },
  { label: 'User Manager', path: '/dashboard/admin/users', icon: '👥' },
  { label: 'Hall of Fame', path: '/dashboard/admin/hall-of-fame', icon: '🏆' },
  { label: 'Guides Manager', path: '/dashboard/admin/guides', icon: '📖' },
  { label: 'Listings', path: '/dashboard/admin/listings', icon: '🏷️' },
  { label: 'Analytics', path: '/dashboard/admin/analytics', icon: '📈' },
]

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

interface ItemRow {
  id: string
  name: string
  headline: string | null
  category: string
  tags: string[] | null
  image_url: string | null
  is_published: boolean
  featured: boolean
  created_at: string
}

export default function AdminHallOfFameManager() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('catalog_items')
      .select('id, name, headline, category, tags, image_url, is_published, featured, created_at')
      .order('created_at', { ascending: false })

    if (filterStatus === 'published') query = query.eq('is_published', true)
    if (filterStatus === 'draft') query = query.eq('is_published', false)

    const { data, error } = await query

    if (!error && data) {
      setItems(data as ItemRow[])
    }
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems()
  }, [fetchItems])

  async function handleTogglePublish(item: ItemRow) {
    setActionLoadingId(item.id)
    const newState = !item.is_published

    const { error } = await supabase
      .from('catalog_items')
      .update({ is_published: newState })
      .eq('id', item.id)

    if (!error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: newState } : i))
    }
    setActionLoadingId(null)
  }

  async function handleToggleFeatured(item: ItemRow) {
    setActionLoadingId(item.id)
    const newState = !item.featured

    const { error } = await supabase
      .from('catalog_items')
      .update({ featured: newState })
      .eq('id', item.id)

    if (!error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, featured: newState } : i))
    }
    setActionLoadingId(null)
  }

  const publishedCount = items.filter(i => i.is_published).length
  const draftCount = items.filter(i => !i.is_published).length
  const featuredCount = items.filter(i => i.featured).length

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Hall of Fame Manager">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {([
            { value: 'all', label: 'All' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Drafts' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid var(--color-border)',
                background: filterStatus === opt.value ? 'var(--color-primary)' : 'var(--color-surface)',
                color: filterStatus === opt.value ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: filterStatus === opt.value ? 700 : 400,
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Link
          to="/dashboard/admin/hall-of-fame/new"
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          + New Item
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{items.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Items</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{publishedCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Published</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eab308' }}>{draftCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Drafts</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>{featuredCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Featured</div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', padding: '32px 0', textAlign: 'center' }}>Loading items…</p>
      ) : items.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏆</div>
          No items {filterStatus !== 'all' ? `(${filterStatus})` : ''} yet.
          <div style={{ marginTop: '1rem' }}>
            <Link to="/dashboard/admin/hall-of-fame/new" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Add your first item →
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                {item.image_url
                  ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : categoryEmoji[item.category] ?? '🏆'
                }
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                    {item.name}
                  </span>
                  {item.featured && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', color: '#5b21b6', backgroundColor: '#ede9fe' }}>
                      ⭐ Featured
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    color: item.is_published ? '#065f46' : '#92400e',
                    backgroundColor: item.is_published ? '#d1fae5' : '#fef3c7',
                  }}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                {item.headline && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '4px' }}>
                    "{item.headline}"
                  </div>
                )}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(item.tags ?? []).map(tag => (
                    <span key={tag} style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#fff',
                      backgroundColor: tagColors[tag] ?? 'var(--color-primary)',
                      padding: '2px 7px',
                      borderRadius: '999px',
                    }}>
                      {tagLabels[tag] ?? tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleToggleFeatured(item)}
                  disabled={actionLoadingId === item.id}
                  title="Toggle featured (hero slot)"
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: item.featured ? '#ede9fe' : 'transparent',
                    color: item.featured ? '#5b21b6' : 'var(--color-text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: actionLoadingId === item.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  ⭐
                </button>
                <button
                  onClick={() => navigate(`/dashboard/admin/hall-of-fame/${item.id}/edit`)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleTogglePublish(item)}
                  disabled={actionLoadingId === item.id}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: actionLoadingId === item.id ? 'var(--color-border)' : item.is_published ? '#ef4444' : '#10b981',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: actionLoadingId === item.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoadingId === item.id ? '…' : item.is_published ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}