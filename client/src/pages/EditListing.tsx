import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { uploadListingImages } from '../lib/storage'
import { CATEGORY_META, CONDITION_META, type ListingCategory, type ListingCondition } from '../lib/listingMeta'

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

const MAX_IMAGES = 5
const MAX_FILE_SIZE_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ListingRow {
  id: string
  title: string
  description: string | null
  price: number
  currency: string
  category: ListingCategory
  condition: ListingCondition
  status: string
  images: string[] | null
  seller_id: string
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-background)',
  color: 'var(--color-text-primary)',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '0.4rem',
}

export default function EditListing() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [listing, setListing] = useState<ListingRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<ListingCategory>('cards')
  const [condition, setCondition] = useState<ListingCondition>('good')

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchListing = useCallback(async () => {
    if (!user || !id) return
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, description, price, currency, category, condition, status, images, seller_id')
      .eq('id', id)
      .eq('seller_id', user.id)
      .maybeSingle()

    if (fetchError || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setListing(data as ListingRow)
    setTitle(data.title)
    setDescription(data.description ?? '')
    setPrice(String(data.price))
    setCategory(data.category)
    setCondition(data.condition)
    setExistingImages(data.images ?? [])
    setLoading(false)
  }, [user, id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListing()
  }, [fetchListing])

  const totalImageCount = existingImages.length + newFiles.length

  function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    setImageError(null)

    const remaining = MAX_IMAGES - totalImageCount
    if (remaining <= 0) {
      setImageError(`You can have at most ${MAX_IMAGES} photos.`)
      return
    }

    const incoming = Array.from(files).slice(0, remaining)
    const accepted: File[] = []

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setImageError('Only JPEG, PNG, and WebP images are supported.')
        continue
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setImageError(`Each image must be under ${MAX_FILE_SIZE_MB}MB.`)
        continue
      }
      accepted.push(file)
    }

    if (accepted.length === 0) return

    setNewFiles(prev => [...prev, ...accepted])
    accepted.forEach(file => {
      const reader = new FileReader()
      reader.onload = e => setNewPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  function removeExistingImage(url: string) {
    setExistingImages(prev => prev.filter(u => u !== url))
  }

  function removeNewFile(index: number) {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    handleFilesSelected(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave() {
    setDragActive(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listing || !user) return

    const priceNumber = parseFloat(price)
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      setError('Enter a valid price.')
      return
    }
    if (totalImageCount === 0) {
      setError('Add at least one photo before saving.')
      return
    }

    setError(null)
    setSaved(false)

    let finalImages = existingImages

    if (newFiles.length > 0) {
      setUploadingPhotos(true)
      try {
        const uploadedUrls = await uploadListingImages(newFiles, user.id, listing.id)
        finalImages = [...existingImages, ...uploadedUrls]
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload photos')
        setUploadingPhotos(false)
        return
      }
      setUploadingPhotos(false)
    }

    setSaving(true)

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        price: priceNumber,
        category,
        condition,
        images: finalImages,
      })
      .eq('id', listing.id)
      .eq('seller_id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => navigate('/dashboard/seller/listings'), 900)
  }

  const sectionStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '1.5rem',
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Edit Listing">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/dashboard/seller/listings" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
          ← Back to My Listings
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading listing...
        </div>
      )}

      {!loading && notFound && (
        <div style={{ ...sectionStyle, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Listing not found
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            This listing doesn't exist or doesn't belong to your account.
          </div>
        </div>
      )}

      {!loading && listing && listing.status === 'sold' && (
        <div style={{ ...sectionStyle, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            This listing has been sold
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            Sold listings can't be edited.
          </div>
        </div>
      )}

      {!loading && listing && listing.status !== 'sold' && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Photos */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                Photos <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({totalImageCount}/{MAX_IMAGES})</span>
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                JPEG, PNG, or WebP, up to {MAX_FILE_SIZE_MB}MB each. At least one photo is required.
              </p>

              {(existingImages.length > 0 || newPreviews.length > 0) && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {existingImages.map((url, i) => (
                    <div key={`existing-${i}`} style={{ position: 'relative', width: '90px', height: '90px' }}>
                      <img
                        src={url}
                        alt={`${listing.title} photo ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        aria-label="Remove photo"
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          width: '22px', height: '22px', borderRadius: '50%',
                          border: '2px solid var(--color-surface)',
                          backgroundColor: '#dc2626', color: '#fff',
                          fontSize: '0.7rem', fontWeight: 700, lineHeight: 1,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {newPreviews.map((src, i) => (
                    <div key={`new-${i}`} style={{ position: 'relative', width: '90px', height: '90px' }}>
                      <img
                        src={src}
                        alt={`New photo ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px', border: '2px solid var(--color-primary)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        aria-label="Remove photo"
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          width: '22px', height: '22px', borderRadius: '50%',
                          border: '2px solid var(--color-surface)',
                          backgroundColor: '#dc2626', color: '#fff',
                          fontSize: '0.7rem', fontWeight: 700, lineHeight: 1,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {totalImageCount < MAX_IMAGES && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{
                    border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '10px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.85rem',
                    backgroundColor: dragActive ? 'var(--color-primary-light)' : 'transparent',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>📷</div>
                  Drag photos here, or click to browse
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={e => handleFilesSelected(e.target.files)}
              />

              {imageError && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                  {imageError}
                </div>
              )}
            </div>

            {/* Core details */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
                Listing Details
              </h2>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={2000}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Price ({listing.currency === 'EUR' ? '€' : listing.currency})</label>
                  <input
                    style={inputStyle}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
                Category
              </h2>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {(Object.keys(CATEGORY_META) as ListingCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: category === cat ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: category === cat ? 'var(--color-primary-light)' : 'var(--color-background)',
                      color: category === cat ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{CATEGORY_META[cat].emoji}</span>
                    {CATEGORY_META[cat].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
                Condition
              </h2>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {(Object.keys(CONDITION_META) as ListingCondition[]).map(cond => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: condition === cond ? `1px solid ${CONDITION_META[cond].color}` : '1px solid var(--color-border)',
                      backgroundColor: condition === cond ? `${CONDITION_META[cond].color}1a` : 'var(--color-background)',
                      color: condition === cond ? CONDITION_META[cond].color : 'var(--color-text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CONDITION_META[cond].color, display: 'inline-block' }} />
                    {CONDITION_META[cond].label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                padding: '12px 16px', borderRadius: '10px', fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            {saved && (
              <div style={{
                backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534',
                padding: '12px 16px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600,
              }}>
                ✅ Listing updated — taking you back to My Listings…
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={saving || uploadingPhotos}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: saving || uploadingPhotos ? 'default' : 'pointer',
                  opacity: saving || uploadingPhotos ? 0.7 : 1,
                }}
              >
                {uploadingPhotos ? 'Uploading photos...' : saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                to="/dashboard/seller/listings"
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      )}
    </DashboardLayout>
  )
}