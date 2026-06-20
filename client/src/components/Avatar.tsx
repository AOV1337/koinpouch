interface AvatarProps {
  url?: string | null
  name?: string | null
  size?: number
}

export default function Avatar({ url, name, size = 40 }: AvatarProps) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || '?'

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--color-primary)',
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
        flexShrink: 0,
      }}
    >
      {!url && initial}
    </div>
  )
}