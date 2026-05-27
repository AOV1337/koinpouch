import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface KycRequest {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  rejection_reason: string | null
  submitted_documents: {
    full_legal_name?: string
    date_of_birth?: string
    country?: string
    id_type?: string
    id_number?: string
    address_line?: string
    city?: string
    postal_code?: string
  } | null
  applicant: { full_name: string | null; email: string | null }[] | null
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KycReviewPanel() {
  const [requests, setRequests] = useState<KycRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('kyc_requests')
      .select(`
        id,
        status,
        submitted_at,
        reviewed_at,
        rejection_reason,
        submitted_documents,
        applicant:user_id (
          full_name,
          email
        )
      `)
      .order('submitted_at', { ascending: false })

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (!error && data) {
      setRequests(data as unknown as KycRequest[])
    }

    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests()
  }, [fetchRequests])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleApprove(request: KycRequest) {
    setActionLoading(request.id)

    const { data: adminData } = await supabase.auth.getUser()
    const adminId = adminData.user?.id ?? null

    // 1. Update kyc_requests
    const { error: reqError } = await supabase
      .from('kyc_requests')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', request.id)

    if (reqError) { setActionLoading(null); return }

    // 2. Update seller_profiles kyc_status
    const { error: spError } = await supabase
      .from('seller_profiles')
      .update({ kyc_status: 'approved' })
      .eq('user_id', request.applicant?.[0] ? await getUserIdFromRequestId(request.id) : '')

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

    // 1. Update kyc_requests
    const { error: reqError } = await supabase
      .from('kyc_requests')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', request.id)

    if (reqError) { setActionLoading(null); return }

    // 2. Update seller_profiles kyc_status
    const userId = await getUserIdFromRequestId(request.id)
    const { error: spError } = await supabase
      .from('seller_profiles')
      .update({ kyc_status: 'rejected' })
      .eq('user_id', userId)

    if (spError) console.error('seller_profiles update failed:', spError)

    setActionLoading(null)
    await fetchRequests()
  }

  // Helper: get user_id from a kyc_request id (needed for seller_profiles update)
  async function getUserIdFromRequestId(requestId: string): Promise<string> {
    const { data } = await supabase
      .from('kyc_requests')
      .select('user_id')
      .eq('id', requestId)
      .single()
    return data?.user_id ?? ''
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const filtered = requests // already filtered by Supabase query

  return (
    <div>
      {/* Header + filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          KYC Requests
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

      {/* Content */}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', padding: '32px 0', textAlign: 'center' }}>Loading requests…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', padding: '32px 0', textAlign: 'center' }}>
          No {filterStatus === 'all' ? '' : filterStatus} KYC requests found.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((req) => {
            const isExpanded = expandedId === req.id
            const applicant = req.applicant?.[0]
            const docs = req.submitted_documents

            return (
              <div
                key={req.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                      {applicant?.full_name ?? 'Unknown'}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      {applicant?.email ?? '—'}
                    </span>
                    <StatusPill status={req.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {new Date(req.submitted_at).toLocaleDateString('en-GB')}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-border)' }}>

                    {/* Submitted documents */}
                    <h4 style={{ margin: '16px 0 12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Submitted Information
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                      <DocRow label="Full Legal Name" value={docs?.full_legal_name} />
                      <DocRow label="Date of Birth" value={docs?.date_of_birth} />
                      <DocRow label="Country" value={docs?.country} />
                      <DocRow label="ID Type" value={docs?.id_type ? (ID_TYPE_LABELS[docs.id_type] ?? docs.id_type) : undefined} />
                      <DocRow label="ID Number" value={docs?.id_number} />
                      <DocRow label="Address" value={docs?.address_line} />
                      <DocRow label="City" value={docs?.city} />
                      <DocRow label="Postal Code" value={docs?.postal_code} />
                    </div>

                    {/* Rejection reason (if already rejected) */}
                    {req.status === 'rejected' && req.rejection_reason && (
                      <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.88rem', color: '#991b1b' }}>
                        <strong>Rejection reason:</strong> {req.rejection_reason}
                      </div>
                    )}

                    {/* Review date */}
                    {req.reviewed_at && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                        Reviewed on {new Date(req.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}

                    {/* Actions — only for pending */}
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <textarea
                          placeholder="Rejection reason (required if rejecting)…"
                          value={rejectionReasons[req.id] ?? ''}
                          onChange={(e) => setRejectionReasons((prev) => ({ ...prev, [req.id]: e.target.value }))}
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
                            onClick={() => handleApprove(req)}
                            disabled={actionLoading === req.id}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: actionLoading === req.id ? 'var(--color-border)' : '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 700,
                              cursor: actionLoading === req.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.9rem',
                            }}
                          >
                            {actionLoading === req.id ? '…' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={actionLoading === req.id}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: actionLoading === req.id ? 'var(--color-border)' : '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 700,
                              cursor: actionLoading === req.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.9rem',
                            }}
                          >
                            {actionLoading === req.id ? '…' : '✗ Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}