import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// ─── Types ───────────────────────────────────────────────────────────────────

type KycStatus = 'pending' | 'approved' | 'rejected'

interface ExistingRequest {
  id: string
  status: KycStatus
  submitted_at: string
  reviewed_at: string | null
  rejection_reason: string | null
}

interface KycFormData {
  full_legal_name: string
  date_of_birth: string
  country: string
  id_type: 'national_id' | 'passport' | 'drivers_license' | ''
  id_number: string
  address_line: string
  city: string
  postal_code: string
}

const EMPTY_FORM: KycFormData = {
  full_legal_name: '',
  date_of_birth: '',
  country: '',
  id_type: '',
  id_number: '',
  address_line: '',
  city: '',
  postal_code: '',
}

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: 'National ID Card',
  passport: 'Passport',
  drivers_license: "Driver's License",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBanner({ request, onResubmit }: { request: ExistingRequest; onResubmit: () => void }) {
  if (request.status === 'pending') {
    return (
      <div style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '32px',
      }}>
        <h3 style={{ margin: '0 0 8px', color: '#92400e', fontSize: '1.1rem' }}>⏳ Verification Under Review</h3>
        <p style={{ margin: 0, color: '#78350f', fontSize: '0.9rem' }}>
          Your KYC request was submitted on {new Date(request.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
          Our team will review it shortly. You'll be notified once a decision is made.
        </p>
      </div>
    )
  }

  if (request.status === 'approved') {
    return (
      <div style={{
        background: '#d1fae5',
        border: '1px solid #10b981',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '32px',
      }}>
        <h3 style={{ margin: '0 0 8px', color: '#065f46', fontSize: '1.1rem' }}>✓ Verification Approved</h3>
        <p style={{ margin: 0, color: '#064e3b', fontSize: '0.9rem' }}>
          Your identity was verified on{' '}
          <strong>
            {request.reviewed_at
              ? new Date(request.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'an unknown date'}
          </strong>
          . You can now sell items on Koinpouch without restrictions.
        </p>
      </div>
    )
  }

  if (request.status === 'rejected') {
    return (
      <div style={{
        background: '#fee2e2',
        border: '1px solid #ef4444',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '32px',
      }}>
        <h3 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: '1.1rem' }}>✗ Verification Rejected</h3>
        {request.rejection_reason && (
          <p style={{ margin: '0 0 16px', color: '#7f1d1d', fontSize: '0.9rem' }}>
            <strong>Reason:</strong> {request.rejection_reason}
          </p>
        )}
        <button
          onClick={onResubmit}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 20px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Submit a New Request
        </button>
      </div>
    )
  }

  return null
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KycSubmission() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [existingRequest, setExistingRequest] = useState<ExistingRequest | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<KycFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // ── Fetch existing request ─────────────────────────────────────────────────

  const fetchExistingRequest = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('kyc_requests')
      .select('id, status, submitted_at, reviewed_at, rejection_reason')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!fetchError && data) {
      setExistingRequest(data as ExistingRequest)
      // Only show the form automatically if there's no request yet
      setShowForm(false)
    } else {
      setExistingRequest(null)
      setShowForm(true)
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExistingRequest()
  }, [fetchExistingRequest])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  function validate(): string | null {
    if (!form.full_legal_name.trim()) return 'Full legal name is required.'
    if (!form.date_of_birth) return 'Date of birth is required.'
    if (!form.country.trim()) return 'Country is required.'
    if (!form.id_type) return 'Please select an ID type.'
    if (!form.id_number.trim()) return 'ID number is required.'
    if (!form.address_line.trim()) return 'Address is required.'
    if (!form.city.trim()) return 'City is required.'
    if (!form.postal_code.trim()) return 'Postal code is required.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    if (!user) return

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('kyc_requests')
      .insert({
        user_id: user.id,
        status: 'pending',
        submitted_documents: {
          full_legal_name: form.full_legal_name.trim(),
          date_of_birth: form.date_of_birth,
          country: form.country.trim(),
          id_type: form.id_type,
          id_number: form.id_number.trim(),
          address_line: form.address_line.trim(),
          city: form.city.trim(),
          postal_code: form.postal_code.trim(),
        },
        submitted_at: new Date().toISOString(),
      })

    if (insertError) {
      setError('Failed to submit your request. Please try again.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    // Refresh to show the pending banner
    await fetchExistingRequest()
  }

  function handleResubmit() {
    setExistingRequest(null)
    setForm(EMPTY_FORM)
    setSuccess(false)
    setError(null)
    setShowForm(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/dashboard/seller')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            padding: '0',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Identity Verification
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          KYC (Know Your Customer) verification allows you to sell items on Koinpouch.
          Your information is stored securely and only reviewed by our admin team.
        </p>
      </div>

      {/* Existing request status banner */}
      {existingRequest && !showForm && (
        <StatusBanner request={existingRequest} onResubmit={handleResubmit} />
      )}

      {/* Success message (shown after fresh submission) */}
      {success && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '24px',
        }}>
          <p style={{ margin: 0, color: '#065f46', fontWeight: 600 }}>
            ✓ Your verification request has been submitted successfully. We'll review it shortly.
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && !success && (
        <form onSubmit={handleSubmit} noValidate>

          <Section title="Personal Information">
            <Field label="Full Legal Name" required>
              <input
                name="full_legal_name"
                value={form.full_legal_name}
                onChange={handleChange}
                placeholder="As it appears on your ID"
                style={inputStyle}
              />
            </Field>

            <Field label="Date of Birth" required>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                style={inputStyle}
              />
            </Field>

            <Field label="Country of Residence" required>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="e.g. Romania"
                style={inputStyle}
              />
            </Field>
          </Section>

          <Section title="Identity Document">
            <Field label="ID Type" required>
              <select
                name="id_type"
                value={form.id_type}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select an ID type…</option>
                {Object.entries(ID_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </Field>

            <Field label="ID Number" required>
              <input
                name="id_number"
                value={form.id_number}
                onChange={handleChange}
                placeholder="Document number"
                style={inputStyle}
              />
            </Field>
          </Section>

          <Section title="Address">
            <Field label="Street Address" required>
              <input
                name="address_line"
                value={form.address_line}
                onChange={handleChange}
                placeholder="Street and house number"
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="City" required>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  style={inputStyle}
                />
              </Field>
              <Field label="Postal Code" required>
                <input
                  name="postal_code"
                  value={form.postal_code}
                  onChange={handleChange}
                  placeholder="Postal code"
                  style={inputStyle}
                />
              </Field>
            </div>
          </Section>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#991b1b',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          {/* Disclaimer */}
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
            By submitting, you confirm that the information provided is accurate and belongs to you.
            False information may result in permanent account suspension.
          </p>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: submitting ? 'var(--color-border)' : '#f97316',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Verification Request'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        margin: '0 0 16px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
        marginBottom: '6px',
      }}>
        {label}{required && <span style={{ color: '#f97316', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--color-text-primary)',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
  outline: 'none',
}