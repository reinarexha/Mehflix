import { Link, useParams } from 'react-router-dom'

type Movie = { id: string; title: string; poster: string }

const demoYouTubeIds = [
  'dQw4w9WgXcQ', '3JZ_D3ELwOQ', 'hY7m5jjJ9mM', 'kxopViU98Xo', '9bZkp7q19f0',
  'tVj0ZTS4WF4', 'CevxZvSJLk8', 'RgKAFK5djSk', 'OPf0YbXqDm0', '60ItHLz5WEA'
]

function generateMovies(seed: string): Movie[] {
  return demoYouTubeIds.map((yt, i) => ({
    id: yt,
    title: `${seed} Trailer ${i + 1}`,
    poster: `https://picsum.photos/seed/${seed}${i}/300/450`
  }))
}

export default function CategoryPage() {
  const { slug = 'category' } = useParams()
  const movies = generateMovies(slug)

  return (
    <main className="max-w-[1280px] mx-auto p-4">
      <h1 className="mt-0 capitalize">{slug.replace('-', ' ')}</h1>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {movies.map(m => (
          <Link key={m.id} to={`/movie/${m.id}`} className="no-underline text-inherit">
            <article className="bg-surface border border-white/10 rounded-md overflow-hidden hover:shadow-xl transition">
              <img src={m.poster} alt="" className="w-full h-[240px] object-cover" />
              <div className="px-3 py-2 font-semibold">{m.title}</div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  )
}


