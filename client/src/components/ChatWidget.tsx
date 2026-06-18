import { useState, useRef, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SERVER_URL = 'http://localhost:5000'

const SUGGESTED_PROMPTS = [
  'How do I tell if a coin is a proof or a regular strike?',
  'What does "near mint" mean for trading cards?',
  'What should I look for when buying a vintage stamp?',
]

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm the Koinpouch Collector's Companion. Ask me about grading, authenticity red flags, terminology, or anything else collecting-related — for cards, figurines, coins, or stamps.",
}

// ─── Singleton-ish module state for open/closed persistence across remounts ───
// (MainLayout doesn't unmount between route changes in a SPA, so plain useState
// in the component is sufficient — no need for context or localStorage here.)

// Custom event name used by external buttons (navbar, home page CTA) to open
// the widget without needing prop-drilling or a context provider.
export const OPEN_CHAT_WIDGET_EVENT = 'koinpouch:open-chat-widget'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Listen for external "open" requests (navbar button, Home page CTA, etc.)
  useEffect(() => {
    function handleExternalOpen() {
      setIsOpen(true)
    }
    window.addEventListener(OPEN_CHAT_WIDGET_EVENT, handleExternalOpen)
    return () => window.removeEventListener(OPEN_CHAT_WIDGET_EVENT, handleExternalOpen)
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${SERVER_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error ?? 'The assistant is having trouble responding right now.')
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleReset() {
    setMessages([WELCOME_MESSAGE])
    setError(null)
  }

  const showSuggestions = messages.length === 1 // only the welcome message so far

  return (
    <>
      {/* Floating toggle button — always visible */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close assistant' : 'Open collector\'s assistant'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          fontSize: '1.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '92px',
          right: '24px',
          width: 'min(380px, calc(100vw - 32px))',
          height: 'min(560px, calc(100vh - 140px))',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1000,
        }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-primary)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                Collector's Companion
              </span>
            </div>
            <button
              onClick={handleReset}
              title="Start a new conversation"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              New chat
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-background)',
                  color: msg.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                }}
              >
                {msg.content}
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '10px 14px',
                borderRadius: '14px 14px 14px 4px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
              }}>
                Thinking…
              </div>
            )}

            {error && (
              <div style={{
                alignSelf: 'center',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                fontSize: '0.8rem',
                textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            {/* Suggested prompts — only shown before the first user message */}
            {showSuggestions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              borderTop: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about grading, authenticity, value factors…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                maxHeight: '80px',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '0 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: loading || !input.trim() ? 'var(--color-text-muted)' : 'var(--color-primary)',
                color: '#fff',
                fontWeight: 700,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
              }}
            >
              →
            </button>
          </form>

          {/* Disclaimer footer */}
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            padding: '0 12px 10px',
            flexShrink: 0,
          }}>
            AI-generated guidance, not a substitute for professional appraisal or authentication.
          </div>
        </div>
      )}
    </>
  )
}