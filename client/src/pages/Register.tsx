import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type Role = 'buyer' | 'seller'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<Role>('buyer')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, fullName, role)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate('/')
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

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: 'var(--color-primary)',
            textDecoration: 'none',
          }}>
            Koinpouch
          </Link>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginTop: '1rem',
            marginBottom: '0.35rem',
          }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Join the collector's marketplace
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '2rem',
        }}>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Role selector */}
            <div>
              <label style={labelStyle}>I want to</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {(['buyer', 'seller'] as Role[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${role === r ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: role === r ? 'var(--color-primary-light)' : 'var(--color-background)',
                      color: role === r ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {r === 'buyer' ? '🛒 Buy' : '🏪 Sell'}
                  </button>
                ))}
              </div>
              {role === 'seller' && (
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0.5rem',
                }}>
                  Seller accounts require KYC verification before listing items!
                </p>
              )}
            </div>

            {/* Full name */}
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="johndoe@example.com"
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="•••••••••••••"
                style={inputStyle}
              />
            </div>

            {/* Confirm password */}
            <div>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="•••••••••••••"
                style={inputStyle}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? 'var(--color-text-muted)' : 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '0.25rem',
              }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p style={{
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              By creating an account you agree to our{' '}
              <Link to="/terms" style={{ color: 'var(--color-primary)' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>
            </p>
          </div>
        </div>

        {/* Footer link */}
        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.9rem',
          color: 'var(--color-text-secondary)',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: 'var(--color-primary)',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}