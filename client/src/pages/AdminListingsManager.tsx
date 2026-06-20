import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { supabase } from '../lib/supabase'
import { CATEGORY_META, CONDITION_META, type ListingCategory, type ListingCondition } from '../lib/listingMeta'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/admin', icon: '📊' },
  { label: 'KYC Review', path: '/dashboard/admin/kyc-requests', icon: '🪪' },
  { label: 'Support Tickets', path: '/dashboard/admin/tickets', icon: '🎧' },
  { label: 'User Manager', path: '/dashboard/admin/users', icon: '👥' },
  { label: 'Hall of Fame', path: '/dashboard/admin/hall-of-fame', icon: '🏆' },
  { label: 'Guides Manager', path: '/dashboard/admin/guides', icon: '📖' },
  { label: 'Listings', path: '/dashboard/admin/listings', icon: '🏷️' },
]

type Status = 'active' | 'sold' | 'removed' | 'suspended'

interface ListingRow {
  id: string
  title: string
  price: number
  currency: string
  category: string
  condition: string
  status: Status
  seller_id: string
  created_at: string
  profiles: { full_name: string | null }[] | { full_name: string | null } | null
}

interface ReportRow {
  id: string
  listing_id: string
  reason: string
  message: string | null
  created_at: string
  profiles: { full_name: string | null }[] | { full_name: string | null } | null
}

const REASON_LABELS: Record<string, string> = {
  fraud: 'Fraud / Scam',
  counterfeit: 'Counterfeit / Fake item',
  misleading: 'Misleading description',
  inappropriate: 'Inappropriate content',
  other: 'Other',
}

const statusColors: Record<Status, string> = {
  active: '#22c55e',
  sold: '#3b82f6',
  removed: '#6b7280',
  suspended: '#ef4444',
}

export default function AdminListingsManager() {
  const [listings, setListings] = useState<ListingRow[]>([])
  const [reportsByListing, setReportsByListing] = useState<Record<string, ReportRow[]>>({})
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | Status | 'reported'>('all')
  const [search, setSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const [{ data: listingData, error: listingError }, { data: reportData }] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, price, currency, category, condition, status, seller_id, created_at, profiles!listings_seller_id_fkey(full_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('listing_reports')
        .select('id, listing_id, reason, message, created_at, profiles!listing_reports_reporter_id_fkey(full_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false }),
    ])

    if (!listingError && listingData) {
      setListings(listingData as unknown as ListingRow[])
    }

    if (reportData) {
      const grouped: Record<string, ReportRow[]> = {}
      for (const r of reportData as unknown as ReportRow[]) {
        if (!grouped[r.listing_id]) grouped[r.listing_id] = []
        grouped[r.listing_id].push(r)
      }
      setReportsByListing(grouped)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const filtered = listings.filter(l => {
    if (filterStatus === 'reported' && !reportsByListing[l.id]?.length) return false
    if (filterStatus !== 'all' && filterStatus !== 'reported' && l.status !== filterStatus) return false
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleSetStatus(listing: ListingRow, newStatus: Status) {
    if (listing.status === newStatus) return
    setActionLoadingId(listing.id)

    const { error } = await supabase
      .from('listings')
      .update({ status: newStatus })
      .eq('id', listing.id)

    if (!error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l))
    }
    setActionLoadingId(null)
  }

  async function handleDismissReport(reportId: string, listingId: string) {
    const { error } = await supabase
      .from('listing_reports')
      .update({ status: 'dismissed' })
      .eq('id', reportId)

    if (!error) {
      setReportsByListing(prev => {
        const remaining = (prev[listingId] ?? []).filter(r => r.id !== reportId)
        const next = { ...prev }
        if (remaining.length > 0) next[listingId] = remaining
        else delete next[listingId]
        return next
      })
    }
  }

  const totalCount = listings.length
  const activeCount = listings.filter(l => l.status === 'active').length
  const removedCount = listings.filter(l => l.status === 'removed' || l.status === 'suspended').length
  const reportedCount = Object.keys(reportsByListing).length

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Listings Manager">

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{totalCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Listings</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{activeCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Active</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6b7280' }}>{removedCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Removed / Suspended</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{reportedCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Reported (open)</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {([
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'sold', label: 'Sold' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'removed', label: 'Removed' },
            { value: 'reported', label: '🚩 Reported' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: opt.value === 'reported' ? '1px solid #ef4444' : '1px solid var(--color-border)',
                background: filterStatus === opt.value
                  ? (opt.value === 'reported' ? '#ef4444' : 'var(--color-primary)')
                  : 'var(--color-surface)',
                color: filterStatus === opt.value ? '#fff' : opt.value === 'reported' ? '#ef4444' : 'var(--color-text-secondary)',
                fontWeight: filterStatus === opt.value ? 700 : 400,
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
            minWidth: '220px',
          }}
        />
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', padding: '32px 0', textAlign: 'center' }}>Loading listings…</p>
      ) : filtered.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏷️</div>
          No listings match this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(listing => {
            const sellerProfile = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles
            const reports = reportsByListing[listing.id] ?? []
            const hasReports = reports.length > 0
            const meta = CATEGORY_META[listing.category as ListingCategory]
            const condMeta = CONDITION_META[listing.condition as ListingCondition]

            return (
              <div
                key={listing.id}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderLeft: hasReports ? '3px solid #ef4444' : '1px solid var(--color-border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  padding: '0.875rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}>
                  {/* Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                  }}>
                    {meta?.emoji ?? '📦'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        {listing.title}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#fff',
                        backgroundColor: statusColors[listing.status],
                        padding: '2px 8px',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                      }}>
                        {listing.status}
                      </span>
                      {hasReports && (
                        <button
                          onClick={() => setExpandedId(prev => prev === listing.id ? null : listing.id)}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#dc2626',
                            backgroundColor: '#fef2f2',
                            border: 'none',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            cursor: 'pointer',
                          }}
                        >
                          🚩 {reports.length} report{reports.length !== 1 ? 's' : ''} {expandedId === listing.id ? '▲' : '▼'}
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Sold by {sellerProfile?.full_name ?? 'Unknown seller'} · {meta?.label ?? listing.category} · {condMeta?.label ?? listing.condition} · {listing.currency === 'EUR' ? '€' : listing.currency}{listing.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {(['active', 'suspended', 'removed'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleSetStatus(listing, s)}
                        disabled={listing.status === s || actionLoadingId === listing.id}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${listing.status === s ? statusColors[s] : 'var(--color-border)'}`,
                          backgroundColor: listing.status === s ? statusColors[s] : 'transparent',
                          color: listing.status === s ? '#fff' : 'var(--color-text-secondary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: listing.status === s || actionLoadingId === listing.id ? 'not-allowed' : 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expanded reports panel */}
                {expandedId === listing.id && hasReports && (
                  <div style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {reports.map(report => {
                      const reporterProfile = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles
                      return (
                        <div key={report.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '10px',
                          padding: '0.75rem 1rem',
                          flexWrap: 'wrap',
                        }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: '#dc2626',
                                backgroundColor: '#fef2f2',
                                padding: '2px 8px',
                                borderRadius: '999px',
                              }}>
                                {REASON_LABELS[report.reason] ?? report.reason}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {reporterProfile?.full_name ?? 'Unknown reporter'} · {new Date(report.created_at).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                            {report.message && (
                              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                {report.message}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDismissReport(report.id, listing.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--color-border)',
                              backgroundColor: 'transparent',
                              color: 'var(--color-text-secondary)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}