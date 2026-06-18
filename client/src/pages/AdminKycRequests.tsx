import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { supabase } from '../lib/supabase'
import { getKycDocumentSignedUrl } from '../lib/storage'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/admin', icon: '📊' },
  { label: 'KYC Review', path: '/dashboard/admin/kyc-requests', icon: '🪪' },
  { label: 'Support Tickets', path: '/dashboard/admin/tickets', icon: '🎧' },
  { label: 'User Manager', path: '/dashboard/admin/users', icon: '👥' },
  { label: 'Item Database', path: '/dashboard/admin/database', icon: '🗄️' },
  { label: 'Guides Manager', path: '/dashboard/admin/guides', icon: '📖' },
  { label: 'Listings', path: '/dashboard/admin/listings', icon: '🏷️' },
  { label: 'Analytics', path: '/dashboard/admin/analytics', icon: '📈' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface KycRequest {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  rejection_reason: string | null
  admin_notes: string | null
  submitted_documents: {
    full_legal_name?: string
    date_of_birth?: string
    country?: string
    id_type?: string
    id_number?: string
    address_line?: string
    city?: string
    postal_code?: string
    id_front_path?: string
    id_back_path?: string
    selfie_path?: string
  } | null
}

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: 'National ID Card',
  passport: 'Passport',
  drivers_license: "Driver's License",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const map = {
    pending:  { label: 'Pending',  color: '#92400e', bg: '#fef3c7' },
    approved: { label: 'Approved', color: '#065f46', bg: '#d1fae5' },
    rejected: { label: 'Rejected', color: '#991b1b', bg: '#fee2e2' },
  }
  const { label, color, bg } = map[status]
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '0.78rem',
      fontWeight: 700,
      color,
      background: bg,
    }}>
      {label}
    </span>
  )
}

function DocRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: '12px', fontSize: '0.88rem' }}>
      <span style={{ color: 'var(--color-text-muted)', minWidth: '140px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

// Document image slot — fetches a fresh signed URL on mount since they expire
function DocumentImage({ path, label }: { path: string | undefined; label: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!path) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      setError(true)
      return
    }
    getKycDocumentSignedUrl(path)
      .then(signedUrl => {
        if (!cancelled) {
          setUrl(signedUrl)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [path])

  return (
    <div>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
        {label}
      </div>
      <div
        onClick={() => url && setZoomed(true)}
        style={{
          height: '160px',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: url ? 'zoom-in' : 'default',
        }}
      >
        {loading && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Loading…</span>}
        {error && !loading && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Not available</span>}
        {url && !loading && !error && (
          <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}
      </div>

      {/* Zoom overlay */}
      {zoomed && url && (
        <div
          onClick={() => setZoomed(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'zoom-out',
            padding: '2rem',
          }}
        >
          <img src={url} alt={label} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminKycRequests() {
  const [requests, setRequests] = useState<KycRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [adminNotesDraft, setAdminNotesDraft] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notesSaving, setNotesSaving] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('kyc_requests')
      .select(`
        id,
        user_id,
        status,
        submitted_at,
        reviewed_at,
        rejection_reason,
        admin_notes,
        submitted_documents
      `)
      .order('submitted_at', { ascending: false })

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (!error && data) {
      const typed = data as unknown as KycRequest[]
      setRequests(typed)
      // Pre-fill notes drafts from DB so the textarea shows existing notes
      setAdminNotesDraft(prev => {
        const next = { ...prev }
        typed.forEach(r => {
          if (next[r.id] === undefined) next[r.id] = r.admin_notes ?? ''
        })
        return next
      })
      // Auto-select first request if none selected yet
      setSelectedId(prevSelected => {
        if (prevSelected && typed.some(r => r.id === prevSelected)) return prevSelected
        return typed[0]?.id ?? null
      })
    }

    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests()
  }, [fetchRequests])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function getUserIdFromRequestId(requestId: string): Promise<string> {
    const { data } = await supabase
      .from('kyc_requests')
      .select('user_id')
      .eq('id', requestId)
      .single()
    return data?.user_id ?? ''
  }

  async function handleApprove(request: KycRequest) {
    setActionLoading(request.id)

    const { data: adminData } = await supabase.auth.getUser()
    const adminId = adminData.user?.id ?? null
    const notes = adminNotesDraft[request.id]?.trim() || null

    const { error: reqError } = await supabase
      .from('kyc_requests')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
        admin_notes: notes,
      })
      .eq('id', request.id)

    if (reqError) { setActionLoading(null); return }

    const userId = await getUserIdFromRequestId(request.id)
    const { error: spError } = await supabase
      .from('seller_profiles')
      .update({ kyc_status: 'approved' })
      .eq('user_id', userId)

    if (spError) console.error('seller_profiles update failed:', spError)

    setActionLoading(null)
    await fetchRequests()
  }

  async function handleReject(request: KycRequest) {
    const reason = rejectionReasons[request.id]?.trim()
    if (!reason) {
      alert('Please enter a rejection reason before rejecting.')
      return
    }

    setActionLoading(request.id)

    const { data: adminData } = await supabase.auth.getUser()
    const adminId = adminData.user?.id ?? null
    const notes = adminNotesDraft[request.id]?.trim() || null

    const { error: reqError } = await supabase
      .from('kyc_requests')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
        admin_notes: notes,
      })
      .eq('id', request.id)

    if (reqError) { setActionLoading(null); return }

    const userId = await getUserIdFromRequestId(request.id)
    const { error: spError } = await supabase
      .from('seller_profiles')
      .update({ kyc_status: 'rejected' })
      .eq('user_id', userId)

    if (spError) console.error('seller_profiles update failed:', spError)

    setActionLoading(null)
    await fetchRequests()
  }

  // Save admin notes independently (e.g. for already-reviewed requests, or before deciding)
  async function handleSaveNotes(request: KycRequest) {
    setNotesSaving(request.id)
    const notes = adminNotesDraft[request.id]?.trim() || null

    const { error } = await supabase
      .from('kyc_requests')
      .update({ admin_notes: notes })
      .eq('id', request.id)

    if (!error) {
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, admin_notes: notes } : r))
    }
    setNotesSaving(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const selected = requests.find(r => r.id === selectedId) ?? null

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="KYC Verification">

      {/* Filter bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Identity Verification Requests
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid var(--color-border)',
                background: filterStatus === s ? '#f97316' : 'var(--color-surface)',
                color: filterStatus === s ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: filterStatus === s ? 700 : 400,
                cursor: 'pointer',
                fontSize: '0.82rem',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', padding: '32px 0', textAlign: 'center' }}>Loading requests…</p>
      ) : requests.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}>
          No {filterStatus === 'all' ? '' : filterStatus} KYC requests found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* Left: request list */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            {requests.map(req => (
              <button
                key={req.id}
                onClick={() => setSelectedId(req.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  background: selectedId === req.id ? 'var(--color-primary-light)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {req.submitted_documents?.full_legal_name ?? '—'}
                  </span>
                  <StatusPill status={req.status} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {new Date(req.submitted_at).toLocaleDateString('en-GB')}
                </div>
              </button>
            ))}
          </div>

          {/* Right: detail panel */}
          {selected && (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {selected.submitted_documents?.full_legal_name ?? 'Unknown'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    #{selected.id.slice(0, 8)}
                  </span>
                </div>
                <StatusPill status={selected.status} />
              </div>

              {/* Document images */}
              <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Identity Documents
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <DocumentImage path={selected.submitted_documents?.id_front_path} label="ID Front" />
                <DocumentImage path={selected.submitted_documents?.id_back_path} label="ID Back" />
                <DocumentImage path={selected.submitted_documents?.selfie_path} label="Selfie with ID" />
              </div>

              {/* Submitted info */}
              <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Submitted Information
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <DocRow label="Full Legal Name" value={selected.submitted_documents?.full_legal_name} />
                <DocRow label="Date of Birth" value={selected.submitted_documents?.date_of_birth} />
                <DocRow label="Country" value={selected.submitted_documents?.country} />
                <DocRow label="ID Type" value={selected.submitted_documents?.id_type ? (ID_TYPE_LABELS[selected.submitted_documents.id_type] ?? selected.submitted_documents.id_type) : undefined} />
                <DocRow label="ID Number" value={selected.submitted_documents?.id_number} />
                <DocRow label="Address" value={selected.submitted_documents?.address_line} />
                <DocRow label="City" value={selected.submitted_documents?.city} />
                <DocRow label="Postal Code" value={selected.submitted_documents?.postal_code} />
              </div>

              {/* Rejection reason (shown to seller) — if already rejected */}
              {selected.status === 'rejected' && selected.rejection_reason && (
                <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.88rem', color: '#991b1b' }}>
                  <strong>Rejection reason (shown to seller):</strong> {selected.rejection_reason}
                </div>
              )}

              {/* Review date */}
              {selected.reviewed_at && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Reviewed on {new Date(selected.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}

              {/* Admin notes — internal only */}
              <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Admin Notes <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(internal only, never shown to the seller)</span>
              </h4>
              <textarea
                placeholder="Internal notes about this request…"
                value={adminNotesDraft[selected.id] ?? ''}
                onChange={(e) => setAdminNotesDraft(prev => ({ ...prev, [selected.id]: e.target.value }))}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.88rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: '10px',
                }}
              />

              {/* For already-reviewed requests: just a save-notes button */}
              {selected.status !== 'pending' && (
                <button
                  onClick={() => handleSaveNotes(selected)}
                  disabled={notesSaving === selected.id}
                  style={{
                    padding: '8px 18px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 600,
                    cursor: notesSaving === selected.id ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  {notesSaving === selected.id ? 'Saving…' : 'Save Notes'}
                </button>
              )}

              {/* Actions — only for pending */}
              {selected.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    placeholder="Rejection reason (required if rejecting, shown to the seller)…"
                    value={rejectionReasons[selected.id] ?? ''}
                    onChange={(e) => setRejectionReasons((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.88rem',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleApprove(selected)}
                      disabled={actionLoading === selected.id}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: actionLoading === selected.id ? 'var(--color-border)' : '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: actionLoading === selected.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      {actionLoading === selected.id ? '…' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(selected)}
                      disabled={actionLoading === selected.id}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: actionLoading === selected.id ? 'var(--color-border)' : '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: actionLoading === selected.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      {actionLoading === selected.id ? '…' : '✗ Reject'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}