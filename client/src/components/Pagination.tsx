interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const delta = 1
  const range: number[] = []

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i)
    }
  }

  const pages: (number | 'ellipsis')[] = []
  let prev = 0
  for (const i of range) {
    if (prev && i - prev > 1) pages.push('ellipsis')
    pages.push(i)
    prev = i
  }
  return pages
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pageNumbers = getPageNumbers(currentPage, totalPages)

  const btnBase = {
    minWidth: '36px',
    height: '36px',
    padding: '0 10px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.4rem',
        marginTop: '2.5rem',
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
      >
        ‹
      </button>

      {pageNumbers.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} style={{ padding: '0 6px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            style={{
              ...btnBase,
              backgroundColor: p === currentPage ? 'var(--color-primary)' : 'var(--color-surface)',
              borderColor: p === currentPage ? 'var(--color-primary)' : 'var(--color-border)',
              color: p === currentPage ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        style={{ ...btnBase, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
      >
        ›
      </button>
    </nav>
  )
}