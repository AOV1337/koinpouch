import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { supabase } from '../lib/supabase'
import { uploadListingImages } from '../lib/storage'
import { useAuth } from '../hooks/useAuth'
import { adminSidebarItems as sidebarItems } from '../lib/adminSidebar'

type Category = 'cards' | 'figurines' | 'coins' | 'stamps'

const categories: { value: Category; label: string; emoji: string }[] = [
  { value: 'cards', label: 'Trading Cards', emoji: '🃏' },
  { value: 'figurines', label: 'Figurines', emoji: '🗿' },
  { value: 'coins', label: 'Coins', emoji: '🪙' },
  { value: 'stamps', label: 'Stamps', emoji: '✉️' },
]

const TAG_OPTIONS = [
  { value: 'holy_grail', label: 'Holy Grail', color: '#eab308' },
  { value: 'production_error', label: 'Production Error', color: '#f97316' },
  { value: 'controversial', label: 'Controversial', color: '#ef4444' },
  { value: 'historically_significant', label: 'Historically Significant', color: '#3b82f6' },
  { value: 'record_breaker', label: 'Record Breaker', color: '#8b5cf6' },
  { value: 'urban_legend', label: 'Urban Legend', color: '#06b6d4' },
]

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

interface CatalogItemRecord {
  id: string
  category: string
  name: string
  headline: string | null
  description: string | null
  origin_year: number | null
  manufacturer: string | null
  rarity: string | null
  tags: string[] | null
  story: string | null
  image_url: string | null
  is_published: boolean
  featured: boolean
}

export default function HallOfFameEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditing = Boolean(id)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<Category>('cards')
  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [description, setDescription] = useState('')
  const [originYear, setOriginYear] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [rarity, setRarity] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [story, setStory] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [featured, setFeatured] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const fetchItem = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('catalog_items')
      .select('id, category, name, headline, description, origin_year, manufacturer, rarity, tags, story, image_url, is_published, featured')
      .eq('id', id)
      .single()

    if (fetchError || !data) {
      setError('Could not load this item.')
      setLoading(false)
      return
    }

    const item = data as CatalogItemRecord
    setCategory((item.category as Category) ?? 'cards')
    setName(item.name)
    setHeadline(item.headline ?? '')
    setDescription(item.description ?? '')
    setOriginYear(item.origin_year ? String(item.origin_year) : '')
    setManufacturer(item.manufacturer ?? '')
    setRarity(item.rarity ?? '')
    setSelectedTags(item.tags ?? [])
    setStory(item.story ?? '')
    setExistingImageUrl(item.image_url)
    setIsPublished(item.is_published)
    setFeatured(item.featured)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItem()
  }, [fetchItem])

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function handleImageSelect(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }
    setError(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const isValid = name.trim() && headline.trim() && description.trim() && story.trim() && selectedTags.length > 0
  const estimatedReadTime = estimateReadTime(story)

  async function handleSave(publishOverride?: boolean) {
    if (!isValid || !user) return
    setError(null)
    setSaving(true)

    const publishState = publishOverride ?? isPublished

    try {
      let itemId = id

      const basePayload = {
        category,
        name: name.trim(),
        headline: headline.trim(),
        description: description.trim(),
        origin_year: originYear ? parseInt(originYear, 10) : null,
        manufacturer: manufacturer.trim() || null,
        rarity: rarity.trim() || null,
        tags: selectedTags,
        story: story.trim(),
        is_published: publishState,
        featured,
        created_by: user.id,
      }

      if (isEditing && itemId) {
        const { error: updateError } = await supabase
          .from('catalog_items')
          .update(basePayload)
          .eq('id', itemId)
        if (updateError) throw updateError
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('catalog_items')
          .insert(basePayload)
          .select('id')
          .single()
        if (insertError) throw insertError
        itemId = inserted.id
      }

      if (imageFile && itemId) {
        const urls = await uploadListingImages([imageFile], user.id, `hof-${itemId}`)
        const { error: imgUpdateError } = await supabase
          .from('catalog_items')
          .update({ image_url: urls[0] })
          .eq('id', itemId)
        if (imgUpdateError) throw imgUpdateError
      }

      navigate('/dashboard/admin/hall-of-fame')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item')
      setSaving(false)
    }
  }

  function renderMarkdownPreview(md: string) {
    const blocks = md.split(/\n\s*\n/).filter(Boolean)
    return blocks.map((block, i) => {
      const trimmed = block.trim()
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={i} style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '1.25rem 0 0.75rem' }}>
            {trimmed.slice(3)}
          </h2>
        )
      }
      const html = trimmed
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
      return (
        <p
          key={i}
          style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.85, margin: '0 0 1rem' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    })
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

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems} title={isEditing ? 'Edit Item' : 'New Hall of Fame Item'}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      </DashboardLayout>
    )
  }

  const displayedImage = imagePreview ?? existingImageUrl

  return (
    <DashboardLayout sidebarItems={sidebarItems} title={isEditing ? 'Edit Item' : 'New Hall of Fame Item'}>
      <div style={{ maxWidth: '820px' }}>

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

        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Hook & Identity
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>
                Headline <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(the clickbait hook shown on the magazine card)</span>
              </label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder='e.g. "The $400,000 Typo Collectors Can&apos;t Stop Chasing"'
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Item Name <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(actual identity, shown on the detail page)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. 1955 Doubled Die Lincoln Cent"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Short Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A 1-2 sentence summary shown on the card and detail page"
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Classification
          </h2>

          <label style={labelStyle}>Category</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: `2px solid ${category === cat.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: category === cat.value ? 'var(--color-primary-light)' : 'var(--color-background)',
                  color: category === cat.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: category === cat.value ? 700 : 500,
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Origin Year</label>
              <input
                type="number"
                value={originYear}
                onChange={e => setOriginYear(e.target.value)}
                placeholder="e.g. 1955"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                placeholder="e.g. US Mint"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Rarity</label>
              <input
                type="text"
                value={rarity}
                onChange={e => setRarity(e.target.value)}
                placeholder="e.g. ~20-24 known"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Tags <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>(select at least one — used for filtering)</span>
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {TAG_OPTIONS.map(tag => {
              const active = selectedTags.includes(tag.value)
              return (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: `2px solid ${active ? tag.color : 'var(--color-border)'}`,
                    backgroundColor: active ? `${tag.color}18` : 'var(--color-background)',
                    color: active ? tag.color : 'var(--color-text-secondary)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Hero Image
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            One strong image — this is what appears on the magazine card and detail page header
          </p>

          {displayedImage ? (
            <div style={{ position: 'relative', height: '220px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: '0.75rem' }}>
              <img src={displayedImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Replace image
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: '10px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
              Click to upload hero image
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => handleImageSelect(e.target.files)}
          />
        </div>

        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              The Story
            </h2>
            <button
              onClick={() => setPreviewMode(p => !p)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: previewMode ? 'var(--color-primary)' : 'transparent',
                color: previewMode ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {previewMode ? '✏️ Edit' : '👁️ Preview'}
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Use <code>## Heading</code> for sections, blank lines for new paragraphs, <code>**bold**</code> and <code>*italic*</code> for emphasis. This is the full narrative readers get on the detail page — the more compelling, the better.
          </p>

          {previewMode ? (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem', backgroundColor: 'var(--color-background)', minHeight: '300px' }}>
              {story.trim()
                ? renderMarkdownPreview(story)
                : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Nothing to preview yet.</p>
              }
            </div>
          ) : (
            <textarea
              value={story}
              onChange={e => setStory(e.target.value)}
              placeholder={'## The Discovery\n\nTell the story here...\n\n## Why It Matters\n\nMore content...'}
              rows={16}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.7 }}
            />
          )}

          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
            Estimated read time: {estimatedReadTime} min
          </div>
        </div>

        <div style={sectionStyle}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={featured}
              onChange={e => setFeatured(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                Feature this item
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Featured items get the large hero slot at the top of the Hall of Fame feed
              </div>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/dashboard/admin/hall-of-fame')}
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

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => handleSave(false)}
              disabled={!isValid || saving}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: !isValid || saving ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: !isValid || saving ? 'not-allowed' : 'pointer',
              }}
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!isValid || saving}
              style={{
                padding: '12px 32px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: !isValid || saving ? 'var(--color-text-muted)' : 'var(--color-primary)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: !isValid || saving ? 'not-allowed' : 'pointer',
                minWidth: '160px',
              }}
            >
              {saving ? 'Saving...' : isPublished ? 'Update & Publish' : 'Publish Item'}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}