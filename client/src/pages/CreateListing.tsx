import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadListingImages } from '../lib/storage'
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

const MAX_IMAGES = 5
const MAX_FILE_SIZE_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function CreateListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [condition, setCondition] = useState<Condition | ''>('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isValid =
    title.trim() &&
    description.trim() &&
    price &&
    parseFloat(price) > 0 &&
    category &&
    condition

  // ─── Image handling ──────────────────────────────────────────────────────────

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return
    const incoming = Array.from(files)
    const remaining = MAX_IMAGES - imageFiles.length

    if (remaining <= 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`)
      return
    }

    const toAdd: File[] = []
    for (const file of incoming.slice(0, remaining)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are supported.')
        return
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Each image must be under ${MAX_FILE_SIZE_MB}MB.`)
        return
      }
      toAdd.push(file)
    }

    setError(null)
    const newFiles = [...imageFiles, ...toAdd]
    setImageFiles(newFiles)

    // Generate previews
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleImageFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!isValid || !user) return
    setError(null)
    setLoading(true)

    try {
      // 1. Insert listing first to get the ID
      setUploadProgress('Creating listing...')
      const { data: listing, error: insertError } = await supabase
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
        .select('id')
        .single()

      if (insertError) throw insertError

      // 2. Upload images if any
      let imageUrls: string[] = []
      if (imageFiles.length > 0) {
        setUploadProgress(`Uploading ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}...`)
        imageUrls = await uploadListingImages(imageFiles, user.id, listing.id)

        // 3. Update listing with image URLs
        const { error: updateError } = await supabase
          .from('listings')
          .update({ images: imageUrls })
          .eq('id', listing.id)

        if (updateError) throw updateError
      }

      navigate('/dashboard/seller/listings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
      setLoading(false)
      setUploadProgress(null)
    }
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────

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
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Category
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
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
              style={{ ...inputStyle, paddingLeft: '2rem' }}
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            All prices are in EUR. Koinpouch does not charge seller fees during the beta period.
          </div>
        </div>

        {/* Images */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            Images
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Up to {MAX_IMAGES} images · JPEG, PNG or WebP · Max {MAX_FILE_SIZE_MB}MB each
          </p>

          {/* Drop zone — only shown when under the limit */}
          {imageFiles.length < MAX_IMAGES && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: '10px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                marginBottom: imagePreviews.length > 0 ? '1rem' : 0,
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-text-secondary)' }}>
                Click or drag images here
              </div>
              <div>{MAX_IMAGES - imageFiles.length} slot{MAX_IMAGES - imageFiles.length !== 1 ? 's' : ''} remaining</div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={e => handleImageFiles(e.target.files)}
          />

          {/* Previews grid */}
          {imagePreviews.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.75rem',
            }}>
              {imagePreviews.map((src, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Badge for first image */}
                  {i === 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      Cover
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
              minWidth: '180px',
            }}
          >
            {loading ? (uploadProgress ?? 'Publishing...') : 'Publish Listing'}
          </button>
        </div>

      </div>
    </DashboardLayout>
  )
}