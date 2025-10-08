import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTrailersByCategory, type Trailer } from '../lib/data'

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
  const [popular, setPopular] = useState<Trailer[] | null>(null)
  const [comingSoon, setComingSoon] = useState<Trailer[] | null>(null)
  const [newReleases, setNewReleases] = useState<Trailer[] | null>(null)

  useEffect(() => {
    // Attempt to fetch real data; fall back silently to demo if env not set
    const run = async () => {
      try {
        const pop = await fetchTrailersByCategory('popular')
        const soon = await fetchTrailersByCategory('coming-soon')
        const newr = await fetchTrailersByCategory('new-release')
        setPopular(pop)
        setComingSoon(soon)
        setNewReleases(newr)
      } catch {
        // ignore in dev without Supabase
      }
    }
    run()
  }, [])

  return (
    <main className="max-w-[1280px] mx-auto p-4">
      <section className="relative mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trailers..."
          className="w-full px-4 py-3 rounded-md bg-input text-text border border-white/10 placeholder:text-muted"
        />
        {query && (
          <div className="absolute left-0 right-0 top-[110%] bg-surface rounded-md shadow-2xl overflow-hidden">
            {results.length === 0 && (
              <div className="px-4 py-3 text-muted">No results</div>
            )}
            {results.map(r => (
              <Link key={r.id} to={`/movie/${r.id}`} className="flex gap-3 px-3 py-2 no-underline text-inherit hover:bg-white/5">
                <img src={r.poster} alt="" width={40} height={56} className="rounded object-cover" />
                <span>{r.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Section title="Popular now" movies={(popular ?? []).map(t => ({ id: t.youtube_id, title: t.title, poster: t.poster_url })) || demo} />
      <Section title="Coming soon" movies={(comingSoon ?? []).map(t => ({ id: t.youtube_id, title: t.title, poster: t.poster_url })) || demo} ctaLabel="Remind me" />
      <Section title="New releases" movies={(newReleases ?? []).map(t => ({ id: t.youtube_id, title: t.title, poster: t.poster_url })) || demo} />
    </main>
  )
}

function Section({ title, movies, ctaLabel }: { title: string; movies: Movie[]; ctaLabel?: string }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3">{title}</h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {movies.map(m => (
          <article key={m.id} className="bg-surface border border-white/10 rounded-md overflow-hidden transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:shadow-xl">
            <Link to={`/movie/${m.id}`} className="no-underline text-inherit block">
              <img src={m.poster} alt="" className="w-full h-[220px] object-cover block" />
              <div className="px-3 py-2">
                <div className="font-semibold">{m.title}</div>
              </div>
            </Link>
            {ctaLabel && (
              <div className="px-3 pb-3">
                <button className="px-3 py-2 rounded-sm bg-button text-[#1c1530] font-semibold">{ctaLabel}</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}


