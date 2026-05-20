import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'

interface CatalogItem {
  id: string
  collection_id: string
  collection_name: string
  category: string
  name: string
  description: string
  images: string[]
  origin_year: number
  manufacturer: string
  rarity: string
  attributes: Record<string, string>
}

const mockItems: Record<string, CatalogItem[]> = {
  'col-1': [
    {
      id: 'item-1',
      collection_id: 'col-1',
      collection_name: 'Pokémon Base Set 1999',
      category: 'cards',
      name: 'Charizard — Holographic Rare',
      description: 'The most iconic card from the original Pokémon Base Set. Charizard\'s holographic version is one of the most recognisable and sought-after cards in the history of the TCG. Its fire-breathing artwork by Mitsuhiro Arita became a cultural symbol of the late 1990s collecting boom.',
      images: [],
      origin_year: 1999,
      manufacturer: 'Wizards of the Coast',
      rarity: 'Holographic Rare',
      attributes: {
        'Card Number': '4/102',
        'Type': 'Fire',
        'HP': '120',
        'Stage': 'Stage 2',
        'Artist': 'Mitsuhiro Arita',
        'Language': 'English',
        'Set Symbol': 'None (Base Set)',
        'Print Variants': '1st Edition, Shadowless, Unlimited',
      },
    },
    {
      id: 'item-2',
      collection_id: 'col-1',
      collection_name: 'Pokémon Base Set 1999',
      category: 'cards',
      name: 'Blastoise — Holographic Rare',
      description: 'The Water-type starter evolution and one of the three holographic starters from the original Base Set. Blastoise features Ken Sugimori\'s original artwork and remains a cornerstone of any serious Pokémon TCG collection.',
      images: [],
      origin_year: 1999,
      manufacturer: 'Wizards of the Coast',
      rarity: 'Holographic Rare',
      attributes: {
        'Card Number': '2/102',
        'Type': 'Water',
        'HP': '100',
        'Stage': 'Stage 2',
        'Artist': 'Ken Sugimori',
        'Language': 'English',
        'Set Symbol': 'None (Base Set)',
        'Print Variants': '1st Edition, Shadowless, Unlimited',
      },
    },
  ],
  'col-2': [
    {
      id: 'item-3',
      collection_id: 'col-2',
      collection_name: 'Roman Imperial Coinage',
      category: 'coins',
      name: 'Denarius of Julius Caesar',
      description: 'Silver denarius issued in the name of Julius Caesar during the final years of the Roman Republic. Among the most historically significant coins in existence — one of the few types featuring a living Roman on its obverse during his lifetime, a revolutionary precedent.',
      images: [],
      origin_year: -44,
      manufacturer: 'Roman Mint',
      rarity: 'Rare',
      attributes: {
        'Metal': 'Silver',
        'Diameter': '17–20mm',
        'Weight': '3.5–4.0g',
        'Obverse': 'Portrait of Caesar, laureate',
        'Reverse': 'Venus standing',
        'Period': 'Late Roman Republic',
        'Reference': 'RSC 39',
        'Mint': 'Rome',
      },
    },
  ],
  'col-3': [
    {
      id: 'item-4',
      collection_id: 'col-3',
      collection_name: 'Great Britain Victorian Era Stamps',
      category: 'stamps',
      name: 'Penny Black — 1840',
      description: 'The world\'s first adhesive postage stamp, issued on 1 May 1840 in the United Kingdom. Features a profile portrait of Queen Victoria engraved by Frederick Heath. Approximately 68 million were printed, but used examples with four clear margins remain highly collectible.',
      images: [],
      origin_year: 1840,
      manufacturer: 'Perkins Bacon & Co.',
      rarity: 'Scarce',
      attributes: {
        'Denomination': '1 penny',
        'Colour': 'Black',
        'Perforation': 'Imperforate',
        'Watermark': 'Small Crown',
        'Plates Used': '1 to 11',
        'Country': 'United Kingdom',
        'SG Catalogue': 'SG 1',
        'Condition Variants': 'Used, Unused (rare), On Cover (very rare)',
      },
    },
  ],
  'col-4': [
    {
      id: 'item-5',
      collection_id: 'col-4',
      collection_name: 'Neon Genesis Evangelion Figures',
      category: 'figurines',
      name: 'Evangelion Unit-01 — Kotobukiya ArtFX J',
      description: 'A highly detailed 1/7 scale pre-painted figure of Evangelion Unit-01 in its iconic battle stance. Produced by Kotobukiya as part of their ArtFX J line, this figure faithfully recreates the distinctive purple biomechanical design of the EVA from the original 1995 anime series.',
      images: [],
      origin_year: 2013,
      manufacturer: 'Kotobukiya',
      rarity: 'Limited',
      attributes: {
        'Scale': '1/7',
        'Height': 'Approx. 280mm',
        'Material': 'PVC / ABS',
        'Series': 'ArtFX J',
        'Type': 'Pre-painted, pre-assembled',
        'Origin': 'Japan',
        'Licence': 'Gainax / Khara',
        'Release Year': '2013',
      },
    },
  ],
}

const categoryEmoji: Record<string, string> = {
  cards: '🃏',
  figurines: '🗿',
  coins: '🪙',
  stamps: '✉️',
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`
  return `${year}`
}

export default function DatabaseItemDetail() {
  const { id } = useParams()
  const [flagged, setFlagged] = useState(false)

  const allItems = Object.values(mockItems).flat()
  const item = allItems.find(i => i.id === id) ?? allItems[0]

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: 'var(--color-text-muted)',
        flexWrap: 'wrap',
      }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link to="/database" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Database</Link>
        <span>›</span>
        <Link to={`/database/${item.collection_id}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
          {item.collection_name}
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{item.name}</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: '2rem',
        alignItems: 'flex-start',
      }}>

        {/* Left column */}
        <div>

          {/* Image */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            height: '360px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8rem',
            marginBottom: '1.5rem',
          }}>
            {item.images.length > 0
              ? <img src={item.images[0]} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              : categoryEmoji[item.category] ?? '📦'
            }
          </div>

          {/* Description */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
              About this item
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, margin: 0 }}>
              {item.description}
            </p>
          </div>

          {/* Attributes — dynamic JSONB rendering */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
              Catalogue Attributes
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}>
              {Object.entries(item.attributes).map(([key, value]) => (
                <div key={key} style={{
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.3rem',
                  }}>
                    {key}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Item info card */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 12px',
              borderRadius: '999px',
              textTransform: 'capitalize',
              marginBottom: '0.75rem',
            }}>
              {categoryEmoji[item.category]} {item.category}
            </div>

            <h1 style={{
              fontSize: '1.3rem',
              fontWeight: 900,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}>
              {item.name}
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Collection', value: item.collection_name },
                { label: 'Manufacturer', value: item.manufacturer },
                { label: 'Origin Year', value: formatYear(item.origin_year) },
                { label: 'Rarity', value: item.rarity },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 600, textAlign: 'right' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* View listings CTA — the duality bridge */}
            <Link
              to={`/browse?catalog_item=${item.id}`}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 700,
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              View listings for this item →
            </Link>
          </div>

          {/* Collection card */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Part of collection
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
              {item.collection_name}
            </div>
            <Link
              to={`/database/${item.collection_id}`}
              style={{
                display: 'block',
                padding: '9px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Browse full collection →
            </Link>
          </div>

          {/* Flag button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setFlagged(true)}
              disabled={flagged}
              style={{
                background: 'none',
                border: 'none',
                color: flagged ? 'var(--color-text-muted)' : 'var(--color-text-muted)',
                fontSize: '0.8rem',
                cursor: flagged ? 'default' : 'pointer',
                textDecoration: flagged ? 'none' : 'underline',
              }}
            >
              {flagged ? '✅ Thanks for the report' : '🚩 Flag incorrect information'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}