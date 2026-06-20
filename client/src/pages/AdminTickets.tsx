import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { adminSidebarItems as sidebarItems } from '../lib/adminSidebar'

type TicketStatus = 'open' | 'in_progress' | 'closed'
type TicketCategory = 'payment' | 'listing' | 'account' | 'other'

interface TicketMessage {
  id: string
  sender_id: string
  message: string
  created_at: string
  profiles: { full_name: string | null; role: string | null } | null
}

interface Ticket {
  id: string
  subject: string
  status: TicketStatus
  category: TicketCategory
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

const statusColors: Record<TicketStatus, { color: string; bg: string; label: string }> = {
  open:        { color: '#92400e', bg: '#fef3c7', label: 'Open' },
  in_progress: { color: '#1e40af', bg: '#dbeafe', label: 'In Progress' },
  closed:      { color: '#166534', bg: '#d1fae5', label: 'Closed' },
}

const STATUS_OPTIONS: TicketStatus[] = ['open', 'in_progress', 'closed']

export default function AdminTickets() {
  const { user } = useAuth()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('open')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // ── Fetch tickets ──────────────────────────────────────────────────────────

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('support_tickets')
      .select('id, subject, status, category, created_at, profiles!support_tickets_user_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })

    if (filterStatus !== 'all') query = query.eq('status', filterStatus)

    const { data } = await query
    setTickets((data as unknown as Ticket[]) ?? [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets()
  }, [fetchTickets])

  // ── Fetch messages for selected ticket ────────────────────────────────────

  const fetchMessages = useCallback(async (ticketId: string) => {
    setMessagesLoading(true)
    const { data } = await supabase
      .from('ticket_messages')
      .select('id, sender_id, message, created_at, profiles!ticket_messages_sender_id_fkey(full_name, role)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    setMessages((data as unknown as TicketMessage[]) ?? [])
    setMessagesLoading(false)
  }, [])

  function handleSelectTicket(ticket: Ticket) {
    setSelectedTicket(ticket)
    setReply('')
    fetchMessages(ticket.id)
  }

  // ── Send reply ─────────────────────────────────────────────────────────────

  async function handleSendReply() {
    if (!reply.trim() || !selectedTicket || !user) return
    setSending(true)

    await supabase
      .from('ticket_messages')
      .insert({ ticket_id: selectedTicket.id, sender_id: user.id, message: reply.trim() })

    // Auto-set to in_progress when admin replies to an open ticket
    if (selectedTicket.status === 'open') {
      await supabase
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', selectedTicket.id)

      const updated = { ...selectedTicket, status: 'in_progress' as TicketStatus }
      setSelectedTicket(updated)
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t))
    }

    setReply('')
    await fetchMessages(selectedTicket.id)
    setSending(false)
  }

  // ── Update status ──────────────────────────────────────────────────────────

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!selectedTicket) return
    setUpdatingStatus(true)

    await supabase
      .from('support_tickets')
      .update({ status: newStatus })
      .eq('id', selectedTicket.id)

    const updated = { ...selectedTicket, status: newStatus }
    setSelectedTicket(updated)
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t))
    setUpdatingStatus(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Support Tickets">
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', height: 'calc(100vh - 140px)', minHeight: '500px' }}>

        {/* ── Left panel: ticket list ── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Filter */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['all', ...STATUS_OPTIONS] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    border: '1px solid var(--color-border)',
                    background: filterStatus === s ? 'var(--color-primary)' : 'transparent',
                    color: filterStatus === s ? '#fff' : 'var(--color-text-secondary)',
                    fontWeight: filterStatus === s ? 700 : 400,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket rows */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>Loading…</div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 16px', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
                No {filterStatus === 'all' ? '' : filterStatus} tickets
              </div>
            ) : (
              tickets.map(ticket => {
                const isSelected = selectedTicket?.id === ticket.id
                const s = statusColors[ticket.status]
                return (
                  <button
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--color-border)',
                      borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                      padding: '14px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ticket.subject}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                      {ticket.profiles?.full_name ?? 'Unknown'} · {new Date(ticket.created_at).toLocaleDateString('en-GB')}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', color: s.color, background: s.bg }}>
                        {s.label}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                        {ticket.category.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right panel: conversation ── */}
        {!selectedTicket ? (
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ fontSize: '2.5rem' }}>🎧</div>
            <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Select a ticket to view the conversation</p>
          </div>
        ) : (
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Ticket header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {selectedTicket.subject}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  From {selectedTicket.profiles?.full_name ?? 'Unknown'}
                  {selectedTicket.profiles?.email ? ` · ${selectedTicket.profiles.email}` : ''}
                  {' · '}{new Date(selectedTicket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Status control */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updatingStatus || selectedTicket.status === s}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      border: '1px solid var(--color-border)',
                      background: selectedTicket.status === s ? statusColors[s].bg : 'transparent',
                      color: selectedTicket.status === s ? statusColors[s].color : 'var(--color-text-muted)',
                      fontWeight: selectedTicket.status === s ? 700 : 400,
                      cursor: selectedTicket.status === s || updatingStatus ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messagesLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading messages…</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>No messages yet</div>
              ) : (
                messages.map(msg => {
                  const isAdmin = msg.profiles?.role === 'admin'
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        background: isAdmin ? 'var(--color-primary)' : 'var(--color-background)',
                        border: isAdmin ? 'none' : '1px solid var(--color-border)',
                        color: isAdmin ? '#fff' : 'var(--color-text-primary)',
                        borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        padding: '10px 14px',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                      }}>
                        {msg.message}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {msg.profiles?.full_name ?? 'Unknown'} · {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} {new Date(msg.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Reply box — only if not closed */}
            {selectedTicket.status !== 'closed' ? (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px' }}>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply…"
                  rows={2}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply() }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={!reply.trim() || sending}
                  style={{
                    padding: '0 20px',
                    background: !reply.trim() || sending ? 'var(--color-border)' : 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: !reply.trim() || sending ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                This ticket is closed. Change status to reply.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}