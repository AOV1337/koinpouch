import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

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

type Category = 'cards' | 'figurines' | 'coins' | 'stamps' | 'general'

const categories: { value: Category; label: string; emoji: string }[] = [
  { value: 'cards', label: 'Trading Cards', emoji: '🃏' },
  { value: 'figurines', label: 'Figurines', emoji: '🗿' },
  { value: 'coins', label: 'Coins', emoji: '🪙' },
  { value: 'stamps', label: 'Stamps', emoji: '✉️' },
  { value: 'general', label: 'General', emoji: '📚' },
]

const topics = [
  'Spotting Fakes',
  'Grading & Condition',
  'Valuation',
  'Storage & Care',
  'Buying Tips',
  'Selling Tips',
  'Beginner Guides',
  'History & Context',
]

const topicColors: Record<string, string> = {
  'Spotting Fakes': '#ef4444',
  'Grading & Condition': '#3b82f6',
  'Valuation': '#22c55e',
  'Storage & Care': '#8b5cf6',
  'Buying Tips': '#f97316',
  'Selling Tips': '#eab308',
  'Beginner Guides': '#06b6d4',
  'History & Context': '#ec4899',
}

const EMOJI_OPTIONS = ['📚', '🃏', '🗿', '🪙', '✉️', '🔍', '💡', '📸', '🛡️', '⭐']

// A block that is *only* a markdown image — ![alt](url) — on its own line.
const IMAGE_BLOCK_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/

const MAX_IMAGE_SIZE_MB = 5
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Rough estimate: 200 words per minute reading speed
function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

interface GuideRecord {
  id: string
  title: string
  slug: string
  category: string
  topic: string | null
  excerpt: string | null
  content: string
  thumbnail_url: string | null
  is_published: boolean
  read_time: number | null
  published_at: string | null
}

export default function GuideEditor() {
  const { id } = useParams() // undefined when creating a new guide
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [category, setCategory] = useState<Category>('general')
  const [topic, setTopic] = useState(topics[0])
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [thumbnailEmoji, setThumbnailEmoji] = useState('📚')
  const [readTimeOverride, setReadTimeOverride] = useState<number | null>(null)
  const [isPublished, setIsPublished] = useState(false)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // ── Load existing guide when editing ──────────────────────────────────────

  const fetchGuide = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('guides')
      .select('id, title, slug, category, topic, excerpt, content, thumbnail_url, is_published, read_time, published_at')
      .eq('id', id)
      .single()

    if (fetchError || !data) {
      setError('Could not load this guide.')
      setLoading(false)
      return
    }

    const guide = data as GuideRecord
    setTitle(guide.title)
    setSlug(guide.slug)
    setSlugManuallyEdited(true) // don't auto-overwrite slug on existing guides
    setCategory((guide.category as Category) ?? 'general')
    setTopic(guide.topic ?? topics[0])
    setExcerpt(guide.excerpt ?? '')
    setContent(guide.content ?? '')
    setThumbnailEmoji(guide.thumbnail_url ?? '📚') // thumbnail_url repurposed to store emoji for now
    setReadTimeOverride(guide.read_time)
    setIsPublished(guide.is_published)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGuide()
  }, [fetchGuide])

  // Auto-generate slug from title unless the user has manually edited it
  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugManuallyEdited) {
      setSlug(slugify(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true)
    setSlug(slugify(value))
  }

  const estimatedReadTime = estimateReadTime(content)
  const effectiveReadTime = readTimeOverride ?? estimatedReadTime

  const isValid = title.trim() && slug.trim() && excerpt.trim() && content.trim() && topic

  // ── Inline images ──────────────────────────────────────────────────────────
  // Reuses the existing public `listing-images` storage bucket (already
  // public-read / authenticated-write — same bucket Hall of Fame hero images
  // use under their own path prefix) rather than provisioning anything new.

  async function handleImageFile(file: File | null) {
    if (!file) return
    setImageError(null)

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPEG, PNG, and WebP images are supported.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setImageError(`Image must be under ${MAX_IMAGE_SIZE_MB}MB.`)
      return
    }

    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `guide-images/${slug || 'draft'}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      const altText = file.name.replace(/\.[^/.]+$/, '')
      const markdown = `\n\n![${altText}](${data.publicUrl})\n\n`

      const textarea = textareaRef.current
      if (textarea && !previewMode) {
        const start = textarea.selectionStart ?? content.length
        const end = textarea.selectionEnd ?? content.length
        setContent(prev => prev.slice(0, start) + markdown + prev.slice(end))
      } else {
        setContent(prev => prev + markdown)
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to upload image.')
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave(publishOverride?: boolean) {
    if (!isValid || !user) return
    setError(null)
    setSaving(true)

    const publishState = publishOverride ?? isPublished

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      category,
      topic,
      excerpt: excerpt.trim(),
      content: content.trim(),
      thumbnail_url: thumbnailEmoji, // storing the emoji string in this column for now — no image upload for guide thumbnails yet
      is_published: publishState,
      read_time: effectiveReadTime,
      author_id: user.id,
      published_at: publishState ? new Date().toISOString() : null,
    }

    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('guides')
          .update(payload)
          .eq('id', id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('guides')
          .insert(payload)
        if (insertError) throw insertError
      }
      navigate('/dashboard/admin/guides')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save guide'
      // Friendlier message for the most common failure: duplicate slug
      if (message.includes('duplicate key') || message.includes('unique')) {
        setError('A guide with this slug already exists. Please choose a different title or slug.')
      } else {
        setError(message)
      }
      setSaving(false)
    }
  }

  // ── Simple markdown preview renderer ──────────────────────────────────────
  // Supports: ## headings, blank-line paragraphs, **bold**, *italic*,
  // and a standalone ![alt](url) line rendered as an actual image.
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
      const imageMatch = trimmed.match(IMAGE_BLOCK_RE)
      if (imageMatch) {
        return (
          <img
            key={i}
            src={imageMatch[2]}
            alt={imageMatch[1]}
            style={{ display: 'block', width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '10px', margin: '1rem 0' }}
          />
        )
      }
      // Bold/italic inline rendering
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

  // ── Styles ──────────────────────────────────────────────────────────────────

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
      <DashboardLayout sidebarItems={sidebarItems} title={isEditing ? 'Edit Guide' : 'New Guide'}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} title={isEditing ? 'Edit Guide' : 'New Guide'}>
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

        {/* Basic info */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Basic Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. How to Spot Fake Pokémon Cards"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Slug <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(used in the URL)</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="how-to-spot-fake-pokemon-cards"
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                /guides/{slug || '...'}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Excerpt</label>
              <textarea
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="A 1-2 sentence summary shown on the guides list page"
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>
          </div>
        </div>

        {/* Category + Topic */}
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

          <label style={labelStyle}>Topic</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {topics.map(t => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: `2px solid ${topic === t ? topicColors[t] : 'var(--color-border)'}`,
                  backgroundColor: topic === t ? `${topicColors[t]}18` : 'var(--color-background)',
                  color: topic === t ? topicColors[t] : 'var(--color-text-secondary)',
                  fontWeight: topic === t ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Thumbnail emoji */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Thumbnail Icon
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Shown on the guide card and detail page header
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setThumbnailEmoji(emoji)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  border: `2px solid ${thumbnailEmoji === emoji ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: thumbnailEmoji === emoji ? 'var(--color-primary-light)' : 'var(--color-background)',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Content
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => handleImageFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                }}
              >
                {uploadingImage ? 'Uploading…' : '🖼️ Insert Image'}
              </button>
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
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Use <code>## Heading</code> for section headings, blank lines for new paragraphs, <code>**bold**</code> and <code>*italic*</code> for emphasis. Click <strong>Insert Image</strong> to drop a photo in at your cursor — it'll sit on its own line between paragraphs.
          </p>

          {imageError && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              marginBottom: '0.75rem',
            }}>
              {imageError}
            </div>
          )}

          {previewMode ? (
            <div style={{
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '1.25rem',
              backgroundColor: 'var(--color-background)',
              minHeight: '300px',
            }}>
              {content.trim()
                ? renderMarkdownPreview(content)
                : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Nothing to preview yet.</p>
              }
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={'## Why this matters\n\nWrite your introduction here...\n\n## Next section\n\nMore content...'}
              rows={16}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.7 }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Estimated read time: {estimatedReadTime} min
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Override:</label>
              <input
                type="number"
                min={1}
                value={readTimeOverride ?? ''}
                onChange={e => setReadTimeOverride(e.target.value ? Number(e.target.value) : null)}
                placeholder={String(estimatedReadTime)}
                style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)', fontSize: '0.8rem' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>min</span>
            </div>
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
            onClick={() => navigate('/dashboard/admin/guides')}
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
              {saving ? 'Saving...' : isPublished ? 'Update & Publish' : 'Publish Guide'}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}