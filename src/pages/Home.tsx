import { useState } from 'react'
import { Link } from 'react-router-dom'

type Movie = { id: string; title: string; poster: string }

// Demo YouTube IDs for clickable trailers
const demoYouTubeIds = [
  'dQw4w9WgXcQ', '3JZ_D3ELwOQ', 'hY7m5jjJ9mM', 'kxopViU98Xo', '9bZkp7q19f0',
  'tVj0ZTS4WF4', 'CevxZvSJLk8', 'RgKAFK5djSk', 'OPf0YbXqDm0', '60ItHLz5WEA'
]

const demo: Movie[] = demoYouTubeIds.map((yt, i) => ({
  id: yt,
  title: `Sample Trailer ${i + 1}`,
  poster: `https://picsum.photos/seed/trailer${i}/300/450`
}))

export default function Home() {
  const [query, setQuery] = useState('')
  const results = demo.filter(m => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
  const [toast, setToast] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)

  const showToast = (message: string) => {
    setToast(message)
    setToastVisible(true)
    window.clearTimeout((showToast as any)._t1)
    window.clearTimeout((showToast as any)._t2)
    ;(showToast as any)._t1 = window.setTimeout(() => setToastVisible(false), 5000)
    ;(showToast as any)._t2 = window.setTimeout(() => setToast(null), 5400)
  }

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '1rem' }}>
      <section style={{ position: 'relative', marginBottom: '1rem' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trailers..."
          style={{
            width: '100%', padding: '0.75rem 1rem',
            background: 'var(--color-input)', color: 'var(--color-text)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)'
          }}
        />
        {query && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '110%',
            background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)', overflow: 'hidden'
          }}>
            {results.length === 0 && (
              <div style={{ padding: '0.75rem 1rem', color: 'var(--color-muted)' }}>No results</div>
            )}
            {results.map(r => (
              <Link key={r.id} to={`/movie/${r.id}`} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0.75rem', textDecoration: 'none', color: 'inherit' }}>
                <img src={r.poster} alt="" width={40} height={56} style={{ borderRadius: 4, objectFit: 'cover' }} />
                <span>{r.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Section title="Popular now" movies={demo} />
      <Section title="Coming soon" movies={demo} ctaLabel="Remind me" onRemind={(date) => showToast(`You’ll be reminded when this movie releases on ${date}! 🍿`)} />
      <Section title="New releases" movies={demo} />

      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
          <div style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
            opacity: toastVisible ? 1 : 0,
            transition: 'opacity 300ms ease'
          }}>{toast}</div>
        </div>
      )}
    </main>
  )
}

function Section({ title, movies, ctaLabel, onRemind }: { title: string; movies: Movie[]; ctaLabel?: string; onRemind?: (date: string) => void }) {
  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ margin: '0 0 0.75rem 0' }}>{title}</h2>
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollSnapType: 'x mandatory' }}>
        {movies.map((m, i) => {
          const release = new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000)
          const dateStr = release.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          return (
          <article key={m.id} style={{ flex: '0 0 160px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', overflow: 'hidden', scrollSnapAlign: 'start' }}>
            <Link to={`/movie/${m.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <img src={m.poster} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '0.5rem 0.75rem' }}>
                <div style={{ fontWeight: 600 }}>{m.title}</div>
              </div>
            </Link>
            {ctaLabel && (
              <div style={{ padding: '0 0.75rem 0.75rem' }}>
                <button style={{
                  background: 'var(--color-button)', color: '#1c1530', border: 'none',
                  borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontWeight: 600
                }} onClick={() => onRemind && onRemind(dateStr)}>{ctaLabel}</button>
              </div>
            )}
          </article>
        )})}
      </div>
    </section>
  )
}


