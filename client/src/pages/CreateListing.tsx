import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'

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

type Category = 'cards' | 'figurines' | 'coins' | 'stamps'
type Condition = 'mint' | 'near_mint' | 'good' | 'fair' | 'poor'

const categories: { value: Category; label: string; emoji: string }[] = [
  { value: 'cards', label: 'Trading Cards', emoji: '🃏' },
  { value: 'figurines', label: 'Figurines', emoji: '🗿' },
  { value: 'coins', label: 'Coins', emoji: '🪙' },
  { value: 'stamps', label: 'Stamps', emoji: '✉️' },
]

const conditions: { value: Condition; label: string; description: string }[] = [
  { value: 'mint', label: 'Mint', description: 'Perfect condition, never used' },
  { value: 'near_mint', label: 'Near Mint', description: 'Minimal wear, almost perfect' },
  { value: 'good', label: 'Good', description: 'Some wear, all details clear' },
  { value: 'fair', label: 'Fair', description: 'Noticeable wear, still complete' },
  { value: 'poor', label: 'Poor', description: 'Heavy wear, major flaws' },
]

const conditionColors: Record<Condition, string> = {
  mint: '#22c55e',
  near_mint: '#84cc16',
  good: '#eab308',
  fair: '#f97316',
  poor: '#ef4444',
}

export default function CreateListing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [condition, setCondition] = useState<Condition | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = title.trim() && description.trim() && price && parseFloat(price) > 0 && category && condition

  const handleSubmit = async () => {
    if (!isValid || !user) return
    setError(null)
    setLoading(true)

    try {
      const { error: insertError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          currency: 'EUR',
          category,
          condition,
          status: 'active',
          images: [],
        })

      if (insertError) throw insertError
      navigate('/dashboard/seller/listings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    marginBottom: '0.5rem',
  }

  const sectionStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '1.5rem',
    marginBottom: '1.25rem',
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Create Listing">
      <div style={{ maxWidth: '720px' }}>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        {/* Basic info */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Basic Information
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Listing Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Charizard Holo 1st Edition — Base Set"
                maxLength={120}
                style={inputStyle}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                {title.length}/120 characters
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your item accurately. Include relevant details such as edition, print run, visible flaws, storage history, and anything a buyer should know."
                rows={6}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                }}
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Category
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '0.75rem',
          }}>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: `2px solid ${category === cat.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: category === cat.value ? 'var(--color-primary-light)' : 'var(--color-background)',
                  color: category === cat.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: category === cat.value ? 700 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.75rem' }}>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Condition
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {conditions.map(cond => (
              <button
                key={cond.value}
                onClick={() => setCondition(cond.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  border: `2px solid ${condition === cond.value ? conditionColors[cond.value] : 'var(--color-border)'}`,
                  backgroundColor: condition === cond.value ? `${conditionColors[cond.value]}18` : 'var(--color-background)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: conditionColors[cond.value],
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: condition === cond.value ? conditionColors[cond.value] : 'var(--color-text-primary)',
                  }}>
                    {cond.label}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {cond.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Price
          </h2>
          <div style={{ position: 'relative', maxWidth: '240px' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              fontWeight: 700,
              fontSize: '1rem',
            }}>
              €
            </span>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              style={{
                ...inputStyle,
                paddingLeft: '2rem',
              }}
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            All prices are in EUR. Koinpouch does not charge seller fees during the beta period.
          </div>
        </div>

        {/* Images placeholder */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Images
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Image upload coming soon. For now, listings will display a category placeholder.
          </p>
          <div style={{
            border: '2px dashed var(--color-border)',
            borderRadius: '10px',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
            Image upload will be available in a future update
          </div>
        </div>

        {/* Submit */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => navigate('/dashboard/seller')}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            style={{
              padding: '12px 32px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: !isValid || loading ? 'var(--color-text-muted)' : 'var(--color-primary)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: !isValid || loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}