import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/seller', icon: '📊' },
  { label: 'My Listings', path: '/dashboard/seller/listings', icon: '🏷️' },
  { label: 'Create Listing', path: '/dashboard/seller/create', icon: '➕' },
  { label: 'Orders Received', path: '/dashboard/seller/orders', icon: '📦' },
  { label: 'KYC Verification', path: '/dashboard/seller/kyc', icon: '🪪' },
  { label: 'Reputation', path: '/dashboard/seller/reputation', icon: '⭐' },
  { label: 'Support', path: '/dashboard/seller/support', icon: '🎧' },
  { label: 'Settings', path: '/dashboard/seller/settings', icon: '⚙️' },
]

const mockStats = [
  { label: 'Active Listings', value: '0', icon: '🏷️' },
  { label: 'Total Sales', value: '0', icon: '💰' },
  { label: 'Reputation', value: 'N/A', icon: '⭐' },
  { label: 'Pending Orders', value: '0', icon: '📦' },
]

export default function SellerDashboard() {
  const { profile } = useProfile()
  const { user } = useAuth()

  // Real KYC request state — drives the banner
  const [kycRequest, setKycRequest] = useState<{
    status: 'pending' | 'approved' | 'rejected'
    submitted_at: string
    reviewed_at: string | null
  } | null>(null)
  const [kycLoading, setKycLoading] = useState(true)

  const fetchKycRequest = useCallback(async () => {
    if (!user) return
    setKycLoading(true)
    const { data } = await supabase
      .from('kyc_requests')
      .select('status, submitted_at, reviewed_at')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setKycRequest(data ?? null)
    setKycLoading(false)
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKycRequest()
  }, [fetchKycRequest])

  // Banner config driven by real kyc_request row
  // If no request exists yet → prompt to start
  // If request exists → show its status
  const hasSubmitted = !kycLoading && kycRequest !== null
  const kycStatus = kycRequest?.status ?? null

  const bannerConfig = {
    none: {
      bg: '#fefce8',
      border: '#fde047',
      color: '#854d0e',
      icon: '🪪',
      title: 'Identity Verification Required',
      message: 'To list items and sell on Koinpouch, you need to complete identity verification.',
      cta: { label: 'Start KYC', to: '/dashboard/seller/kyc', style: 'primary' as const },
    },
    pending: {
      bg: '#fefce8',
      border: '#fde047',
      color: '#854d0e',
      icon: '⏳',
      title: 'Verification Under Review',
      message: `Your request was submitted on ${kycRequest ? new Date(kycRequest.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}. Our team will review it shortly.`,
      cta: null,
    },
    approved: {
      bg: '#f0fdf4',
      border: '#86efac',
      color: '#166534',
      icon: '✅',
      title: 'Verified Seller',
      message: `Your account was verified on ${kycRequest?.reviewed_at ? new Date(kycRequest.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}. You can list items and sell on Koinpouch.`,
      cta: null,
    },
    rejected: {
      bg: '#fef2f2',
      border: '#fecaca',
      color: '#dc2626',
      icon: '❌',
      title: 'KYC Rejected',
      message: 'Your verification was rejected. Please resubmit with correct information.',
      cta: { label: 'Resubmit KYC', to: '/dashboard/seller/kyc', style: 'danger' as const },
    },
  }

  const bannerKey = kycLoading ? null : !hasSubmitted ? 'none' : kycStatus ?? 'none'
  const banner = bannerKey ? bannerConfig[bannerKey] : null

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Seller Dashboard">

      {/* KYC Status Banner */}
      {!kycLoading && banner && (
        <div style={{
          backgroundColor: banner.bg,
          border: `1px solid ${banner.border}`,
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{banner.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: banner.color, marginBottom: '0.2rem' }}>
                {banner.title}
              </div>
              <div style={{ fontSize: '0.85rem', color: banner.color, opacity: 0.85 }}>
                {banner.message}
              </div>
            </div>
          </div>
          {banner.cta && (
            <Link to={banner.cta.to} style={{
              padding: '8px 16px',
              backgroundColor: banner.cta.style === 'danger' ? '#dc2626' : 'var(--color-primary)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {banner.cta.label}
            </Link>
          )}
        </div>
      )}

      {/* Welcome */}
      <div style={{
        backgroundColor: 'var(--color-primary-light)',
        border: '1px solid var(--color-primary)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: '1.1rem',
          color: 'var(--color-primary)',
          marginBottom: '0.25rem',
        }}>
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Seller'} 👋
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
        }}>
          Here's an overview of your seller activity.
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {mockStats.map(stat => (
          <div key={stat.label} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
            <span style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              lineHeight: 1,
            }}>
              {stat.value}
            </span>
            <span style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
            }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {[
          { label: 'Create a Listing', path: '/dashboard/seller/create', icon: '➕', disabled: kycStatus !== 'approved' },
          { label: 'View My Listings', path: '/dashboard/seller/listings', icon: '🏷️', disabled: false },
          { label: 'Check Orders', path: '/dashboard/seller/orders', icon: '📦', disabled: false },
          { label: 'View Reputation', path: '/dashboard/seller/reputation', icon: '⭐', disabled: false },
        ].map(action => (
          <Link
            key={action.label}
            to={action.disabled ? '#' : action.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              textDecoration: 'none',
              color: action.disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              opacity: action.disabled ? 0.6 : 1,
              cursor: action.disabled ? 'not-allowed' : 'pointer',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!action.disabled)
                e.currentTarget.style.borderColor = 'var(--color-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{action.icon}</span>
            {action.label}
            {action.disabled && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.7rem',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 600,
              }}>
                KYC required
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Recent sales */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.5rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            Recent Sales
          </h2>
          <span style={{
            fontSize: '0.85rem',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontWeight: 600,
          }}>
            View all →
          </span>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '2.5rem 0',
          color: 'var(--color-text-muted)',
          fontSize: '0.9rem',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
          No sales yet. Once your KYC is approved, start listing items to make your first sale.
        </div>
      </div>

    </DashboardLayout>
  )
}