import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/buyer', icon: '📊' },
  { label: 'My Orders', path: '/dashboard/buyer/orders', icon: '📦' },
  { label: 'Bookmarks', path: '/dashboard/buyer/bookmarks', icon: '🔖' },
  { label: 'Support', path: '/dashboard/buyer/support', icon: '🎧' },
  { label: 'Settings', path: '/dashboard/buyer/settings', icon: '⚙️' },
]

type TicketCategory = 'payment' | 'listing' | 'account' | 'other'
type TicketStatus = 'open' | 'in_progress' | 'closed'

interface Ticket {
  id: string
  subject: string
  status: TicketStatus
  category: TicketCategory
  created_at: string
}

const statusColors: Record<TicketStatus, { color: string; bg: string; label: string }> = {
  open: { color: '#92400e', bg: '#fef3c7', label: 'Open' },
  in_progress: { color: '#1e40af', bg: '#dbeafe', label: 'In Progress' },
  closed: { color: '#166534', bg: '#d1fae5', label: 'Closed' },
}

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: 'payment', label: 'Payment Issue' },
  { value: 'listing', label: 'Listing / Item Problem' },
  { value: 'account', label: 'Account Issue' },
  { value: 'other', label: 'Other' },
]

export default function BuyerSupport() {
  const { user } = useAuth()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<TicketCategory>('other')
  const [message, setMessage] = useState('')

  const fetchTickets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('support_tickets')
      .select('id, subject, status, category, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setTickets((data as Ticket[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets()
  }, [fetchTickets])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (!user) return

    setSubmitting(true)
    setError(null)

    // Insert ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({ user_id: user.id, subject: subject.trim(), status: 'open', category })
      .select('id')
      .single()

    if (ticketError || !ticketData) {
      setError('Failed to submit ticket. Please try again.')
      setSubmitting(false)
      return
    }

    // Insert first message
    await supabase
      .from('ticket_messages')
      .insert({ ticket_id: ticketData.id, sender_id: user.id, message: message.trim() })

    setSubmitting(false)
    setSubmitSuccess(true)
    setSubject('')
    setCategory('other')
    setMessage('')
    setShowForm(false)
    await fetchTickets()
    setTimeout(() => setSubmitSuccess(false), 4000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-text-primary)',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Support">

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>My Support Tickets</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Our team typically responds within 24 hours.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(prev => !prev); setError(null) }}
          style={{
            padding: '9px 18px',
            background: showForm ? 'var(--color-surface)' : 'var(--color-primary)',
            color: showForm ? 'var(--color-text-secondary)' : '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {showForm ? 'Cancel' : '+ New Ticket'}
        </button>
      </div>

      {/* Success message */}
      {submitSuccess && (
        <div style={{ background: '#d1fae5', border: '1px solid #10b981', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#065f46', fontWeight: 600, fontSize: '0.9rem' }}>
          ✓ Ticket submitted successfully. We'll be in touch soon.
        </div>
      )}

      {/* New ticket form */}
      {showForm && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            New Support Ticket
          </h3>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Subject <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Briefly describe your issue"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Category <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as TicketCategory)}
                  style={inputStyle}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Message <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail…"
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#991b1b', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px',
                  background: submitting ? 'var(--color-border)' : 'var(--color-primary)',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>Loading…</div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
          <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>No tickets yet</p>
          <p style={{ fontSize: '0.875rem' }}>If you run into any issues, open a ticket above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tickets.map(ticket => {
            const s = statusColors[ticket.status]
            return (
              <div key={ticket.id} style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '3px' }}>
                    {ticket.subject}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                    {ticket.category.replace('_', ' ')} · {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
                  color: s.color, background: s.bg,
                }}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}