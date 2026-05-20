import { useParams, Link } from 'react-router-dom'

interface GuideContent {
  slug: string
  title: string
  category: string
  topic: string
  author: string
  published_at: string
  read_time: number
  thumbnail_emoji: string
  sections: {
    heading?: string
    body: string
    image?: string
    tip?: string
  }[]
}

const mockGuides: Record<string, GuideContent> = {
  'how-to-spot-fake-pokemon-cards': {
    slug: 'how-to-spot-fake-pokemon-cards',
    title: 'How to Spot Fake Pokémon Cards',
    category: 'cards',
    topic: 'Spotting Fakes',
    author: 'Koinpouch Team',
    published_at: '2026-04-10',
    read_time: 8,
    thumbnail_emoji: '🃏',
    sections: [
      {
        heading: 'Why fakes are a real problem',
        body: 'The Pokémon TCG market has grown enormously over the past decade, with some individual cards fetching tens of thousands of euros at auction. This has made counterfeiting highly profitable, and fake cards have become increasingly sophisticated. Understanding how to identify them is an essential skill for any serious collector or buyer.',
      },
      {
        heading: 'The light test',
        body: 'One of the simplest and most reliable checks is the light test. Hold the card up to a bright light source. Genuine Pokémon cards have a black layer sandwiched between two layers of paper, which blocks light almost completely. Fake cards often lack this layer and will appear significantly more transparent when held up to light.',
        tip: 'Use your phone torch for this test. Genuine cards should show almost no light through them.',
      },
      {
        heading: 'Print quality and colour',
        body: 'Examine the card closely under good lighting. Genuine cards have sharp, clean printing with consistent colour saturation. Counterfeits often show rosette patterns visible to the naked eye — small circular dot patterns from low-quality printing. The colours may also appear washed out, oversaturated, or slightly off compared to a reference card.',
      },
      {
        heading: 'Card texture and feel',
        body: 'Authentic Pokémon cards have a very specific feel. The front surface is smooth with a slight sheen, while the back has a consistent texture. Fake cards frequently feel flimsy, too stiff, or have a noticeably different texture. The edges of genuine cards are also cleanly cut — counterfeits may have rough or uneven edges.',
        tip: 'If you can, always compare against a known genuine card of similar age. The difference in feel is often immediately apparent.',
      },
      {
        heading: 'Font and text accuracy',
        body: 'Examine the card text carefully. Genuine cards use specific proprietary fonts that counterfeiters rarely replicate perfectly. Look for inconsistent spacing, slightly wrong font weights, or text that appears blurry at the edges. The HP number, card name, and attack descriptions are common areas where fakes fall short.',
      },
      {
        heading: 'The rip test — a last resort',
        body: 'A definitive but destructive test is to rip a corner of the card. Genuine Pokémon cards reveal a black inner layer between two white paper layers. Fakes typically show no black layer or a different layering structure entirely. Only use this test on cards you are certain are fake — it destroys the card permanently.',
      },
      {
        heading: 'When in doubt, get it graded',
        body: 'If you are purchasing a high-value card and are unsure of its authenticity, consider submitting it to a professional grading service such as PSA, BGS (Beckett), or CGC. These companies authenticate cards and seal them in tamper-evident cases with a grade. A graded card from a reputable service is the gold standard for authenticity verification.',
      },
    ],
  },
  'understanding-coin-grading': {
    slug: 'understanding-coin-grading',
    title: 'Understanding Coin Grading: The Sheldon Scale',
    category: 'coins',
    topic: 'Grading & Condition',
    author: 'Koinpouch Team',
    published_at: '2026-04-05',
    read_time: 12,
    thumbnail_emoji: '🪙',
    sections: [
      {
        heading: 'What is the Sheldon Scale?',
        body: 'The Sheldon Scale is the standard 70-point grading system used by professional coin grading services worldwide, including PCGS and NGC. Developed by Dr. William Sheldon in 1949, it assigns a numerical grade from 1 (Poor) to 70 (Perfect Uncirculated) to describe a coin\'s condition. Understanding this scale is fundamental to buying and selling coins at fair prices.',
      },
      {
        heading: 'Circulated grades (1–58)',
        body: 'Coins that have been used in everyday commerce fall into the circulated category. The key grades are: Poor (P-1) — barely identifiable; Fair (F-2) — heavily worn but major details visible; Good (G-4 to G-6) — heavily worn, design clear; Very Good (VG-8 to VG-10) — well worn, main features clear; Fine (F-12 to F-15) — moderate wear on high points; Very Fine (VF-20 to VF-35) — light wear throughout; Extremely Fine (EF-40 to EF-45) — light wear on high points only; About Uncirculated (AU-50 to AU-58) — slight wear on the very highest points.',
        tip: 'For most collectors, VF-20 or above represents a coin that still has significant visual appeal and detail.',
      },
      {
        heading: 'Uncirculated grades (60–70)',
        body: 'Mint State (MS) grades from 60 to 70 describe coins that have never been used in circulation. The difference between grades in this range comes down to the number and severity of contact marks, the quality of the luster, and the sharpness of the strike. MS-60 may have many marks and dull luster, while MS-70 is a perfect coin with no marks visible under 5x magnification.',
      },
      {
        heading: 'Why professional grading matters',
        body: 'The difference in value between grade levels can be dramatic. A coin graded MS-63 might sell for €200, while the same coin in MS-65 could fetch €2,000 or more. Professional grading services provide an objective, third-party assessment that protects both buyers and sellers. PCGS and NGC are the two most respected services globally.',
      },
    ],
  },
}

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

const fallbackGuide: GuideContent = {
  slug: 'not-found',
  title: 'Guide Not Found',
  category: 'general',
  topic: 'Beginner Guides',
  author: 'Koinpouch Team',
  published_at: new Date().toISOString(),
  read_time: 1,
  thumbnail_emoji: '📚',
  sections: [
    {
      body: 'This guide could not be found. It may have been moved or is not yet published. Please return to the guides page to find what you are looking for.',
    },
  ],
}

export default function GuideDetail() {
  const { slug } = useParams()
  const guide = (slug && mockGuides[slug]) ? mockGuides[slug] : fallbackGuide

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '2rem',
        fontSize: '0.875rem',
        color: 'var(--color-text-muted)',
        flexWrap: 'wrap',
      }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link to="/guides" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Guides</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{guide.title}</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 260px',
        gap: '2.5rem',
        alignItems: 'flex-start',
      }}>

        {/* Main article */}
        <article>

          {/* Header */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: topicColors[guide.topic] ?? 'var(--color-primary)',
                padding: '3px 10px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {guide.topic}
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-light)',
                padding: '3px 10px',
                borderRadius: '999px',
                textTransform: 'capitalize',
              }}>
                {guide.category}
              </span>
            </div>

            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}>
              {guide.title}
            </h1>

            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              <span>✍️ {guide.author}</span>
              <span>📅 {new Date(guide.published_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>⏱️ {guide.read_time} min read</span>
            </div>
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {guide.sections.map((section, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                }}
              >
                {section.heading && (
                  <h2 style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                    marginBottom: '0.875rem',
                    letterSpacing: '-0.01em',
                  }}>
                    {section.heading}
                  </h2>
                )}

                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.85,
                  margin: 0,
                }}>
                  {section.body}
                </p>

                {section.tip && (
                  <div style={{
                    marginTop: '1rem',
                    backgroundColor: 'var(--color-primary-light)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: '10px',
                    padding: '0.875rem 1rem',
                    display: 'flex',
                    gap: '0.625rem',
                    alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {section.tip}
                    </p>
                  </div>
                )}

                {section.image && (
                  <div style={{
                    marginTop: '1rem',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                  }}>
                    <img src={section.image} alt="" style={{ width: '100%', display: 'block' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer nav */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <Link to="/guides" style={{
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              ← Back to Guides
            </Link>
            <Link to="/browse" style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}>
              Browse Marketplace →
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <aside style={{
          position: 'sticky',
          top: '80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>

          {/* Table of contents */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '1.25rem',
          }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.875rem',
            }}>
              Contents
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {guide.sections.filter(s => s.heading).map((section, idx) => (
                <div key={idx} style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.4,
                  paddingLeft: '0.5rem',
                  borderLeft: '2px solid var(--color-border)',
                }}>
                  {section.heading}
                </div>
              ))}
            </div>
          </div>

          {/* Related action */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '1.25rem',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛒</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
              Ready to buy?
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.875rem', lineHeight: 1.5 }}>
              Browse verified listings for {guide.category} on the marketplace.
            </div>
            <Link
              to={`/browse?category=${guide.category}`}
              style={{
                display: 'block',
                padding: '9px',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              Browse {guide.category} →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}