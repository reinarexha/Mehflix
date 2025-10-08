import { Link } from 'react-router-dom'
import { useRef } from 'react'

type Category = { id: string; name: string }
type Movie = { id: string; title: string; poster: string }

const demoYouTubeIds = [
  'dQw4w9WgXcQ', '3JZ_D3ELwOQ', 'hY7m5jjJ9mM', 'kxopViU98Xo', '9bZkp7q19f0',
  'tVj0ZTS4WF4', 'CevxZvSJLk8', 'RgKAFK5djSk', 'OPf0YbXqDm0', '60ItHLz5WEA'
]

const categories: Category[] = [
  { id: 'horror', name: 'Horror' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'action', name: 'Action' },
  { id: 'crime', name: 'Crime' },
  { id: 'drama', name: 'Drama' },
  { id: 'romance', name: 'Romance' },
  { id: 'animation', name: 'Animation' },
  { id: 'family', name: 'Family' },
  { id: 'scifi', name: 'Sci-Fi' },
  { id: 'musical', name: 'Musical' },
  { id: 'documentary', name: 'Documentary' },
  { id: 'thriller', name: 'Thriller' }
]

function generateMovies(seed: string): Movie[] {
  return demoYouTubeIds.map((yt, i) => ({
    id: yt,
    title: `${seed} Trailer ${i + 1}`,
    poster: `https://picsum.photos/seed/${seed}${i}/300/450`
  }))
}

export default function Categories() {
  return (
    <main className="max-w-[1280px] mx-auto p-4">
      <h1 className="mt-0">Categories</h1>
      <div className="space-y-8">
        {categories.map(c => (
          <CategoryRow key={c.id} name={c.name} movies={generateMovies(c.id)} />
        ))}
      </div>
    </main>
  )
}

function CategoryRow({ name, movies }: { name: string; movies: Movie[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const scrollBy = (delta: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xl font-semibold">{name}</div>
        <Link to={`/category/${name.toLowerCase().replace(/\s+/g,'-')}`} className="text-button no-underline">See all</Link>
      </div>
      <div className="relative">
        <button aria-label="Scroll left" onClick={() => scrollBy(-300)} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white backdrop-blur px-2 py-2 rounded-full">
          ‹
        </button>
        <div ref={scrollerRef} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
          {movies.map(m => (
            <Link key={m.id} to={`/movie/${m.id}`} className="group shrink-0 w-[220px] snap-start">
              <div className="relative h-[280px]">
                <div className="absolute inset-0 rounded-lg bg-surface border border-white/10" />
                <img src={m.poster} alt="" className="absolute inset-y-0 left-4 w-[200px] h-full object-cover rounded-lg opacity-60 blur-[1px] -rotate-2 scale-[0.98]" />
                <img src={m.poster} alt="" className="absolute inset-0 w-full h-full object-cover rounded-lg ring-2 ring-transparent group-hover:ring-button transition" />
              </div>
              <div className="mt-2 text-center">{m.title}</div>
            </Link>
          ))}
        </div>
        <button aria-label="Scroll right" onClick={() => scrollBy(300)} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white backdrop-blur px-2 py-2 rounded-full">
          ›
        </button>
      </div>
    </section>
  )
}


