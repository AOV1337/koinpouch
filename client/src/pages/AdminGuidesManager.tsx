import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { supabase } from '../lib/supabase'
import { adminSidebarItems as sidebarItems } from '../lib/adminSidebar'

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

interface GuideRow {
  id: string
  title: string
  slug: string
  category: string
  topic: string | null
  thumbnail_url: string | null
  is_published: boolean
  read_time: number | null
  published_at: string | null
  created_at: string
}

export default function AdminGuidesManager() {
  const navigate = useNavigate()
  const [guides, setGuides] = useState<GuideRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchGuides = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('guides')
      .select('id, title, slug, category, topic, thumbnail_url, is_published, read_time, published_at, created_at')
      .order('created_at', { ascending: false })

    if (filterStatus === 'published') query = query.eq('is_published', true)
    if (filterStatus === 'draft') query = query.eq('is_published', false)

    const { data, error } = await query

    if (!error && data) {
      setGuides(data as GuideRow[])
    }
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGuides()
  }, [fetchGuides])

  async function handleTogglePublish(guide: GuideRow) {
    setActionLoadingId(guide.id)
    const newState = !guide.is_published

    const { error } = await supabase
      .from('guides')
      .update({
        is_published: newState,
        published_at: newState ? (guide.published_at ?? new Date().toISOString()) : guide.published_at,
      })
      .eq('id', guide.id)

    if (!error) {
      setGuides(prev => prev.map(g => g.id === guide.id ? { ...g, is_published: newState } : g))
    }
    setActionLoadingId(null)
  }

  const publishedCount = guides.filter(g => g.is_published).length
  const draftCount = guides.filter(g => !g.is_published).length

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Guides Manager">

      {/* Header */}
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
          to="/dashboard/admin/guides/new"
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
          + New Guide
        </Link>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{guides.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Guides</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{publishedCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Published</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eab308' }}>{draftCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Drafts</div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', padding: '32px 0', textAlign: 'center' }}>Loading guides…</p>
      ) : guides.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📖</div>
          No guides {filterStatus !== 'all' ? `(${filterStatus})` : ''} yet.
          <div style={{ marginTop: '1rem' }}>
            <Link to="/dashboard/admin/guides/new" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Write your first guide →
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {guides.map(guide => (
            <div
              key={guide.id}
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
              {/* Thumbnail */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}>
                {guide.thumbnail_url ?? '📚'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                    {guide.title}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    color: guide.is_published ? '#065f46' : '#92400e',
                    backgroundColor: guide.is_published ? '#d1fae5' : '#fef3c7',
                  }}>
                    {guide.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {guide.topic && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#fff',
                      backgroundColor: topicColors[guide.topic] ?? 'var(--color-primary)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}>
                      {guide.topic}
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                    {guide.category}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    ⏱️ {guide.read_time ?? '—'} min
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {guide.is_published && (
                  <Link
                    to={`/guides/${guide.slug}`}
                    target="_blank"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    View
                  </Link>
                )}
                <button
                  onClick={() => navigate(`/dashboard/admin/guides/${guide.id}/edit`)}
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
                  onClick={() => handleTogglePublish(guide)}
                  disabled={actionLoadingId === guide.id}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: actionLoadingId === guide.id ? 'var(--color-border)' : guide.is_published ? '#ef4444' : '#10b981',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: actionLoadingId === guide.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoadingId === guide.id ? '…' : guide.is_published ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}