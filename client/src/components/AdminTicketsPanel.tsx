import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface PreviewTicket {
  id: string
  subject: string
  category: string
  created_at: string
  profiles: { full_name: string | null } | null
}

export default function AdminTicketsPanel() {
  const [tickets, setTickets] = useState<PreviewTicket[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const [{ data }, { count: total }] = await Promise.all([
      supabase
        .from('support_tickets')
        .select('id, subject, category, created_at, profiles!support_tickets_user_id_fkey(full_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open'),
    ])
    setTickets((data as unknown as PreviewTicket[]) ?? [])
    setCount(total ?? 0)
    
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets()
  }, [fetchTickets])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          🎧 Open Support Tickets
        </h2>
        <Link
          to="/dashboard/admin/tickets"
          style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
        >
          View all →
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Loading…
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
          No open support tickets
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tickets.map((ticket, idx) => (
            <Link
              key={ticket.id}
              to="/dashboard/admin/tickets"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: idx < tickets.length - 1 ? '1px solid var(--color-border)' : 'none',
                textDecoration: 'none',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                  {ticket.subject}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {ticket.profiles?.full_name ?? 'Unknown'} · {ticket.category.replace('_', ' ')}
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                {new Date(ticket.created_at).toLocaleDateString('en-GB')}
              </span>
            </Link>
          ))}
          {count > 4 && (
            <Link
              to="/dashboard/admin/tickets"
              style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              +{count - 4} more open tickets
            </Link>
          )}
        </div>
      )}
    </div>
  )
}