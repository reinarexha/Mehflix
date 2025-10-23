import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// App categories and their slug ids
 type Category = { id: string; name: string }
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

type Movie = {
  id: number
  title?: string
  poster_url?: string
  genre?: string
  popularity?: number
}

function normalizeGenreToken(token: string): string | null {
  const t = token.trim().toLowerCase()
  if (!t) return null
  if (t === 'science fiction' || t === 'sci fi' || t === 'sci-fi') return 'scifi'
  if (t === 'sci fi & fantasy') return 'scifi'
  if (t === 'family') return 'family'
  if (t === 'animation') return 'animation'
  if (t === 'action') return 'action'
  if (t === 'comedy') return 'comedy'
  if (t === 'crime') return 'crime'
  if (t === 'drama') return 'drama'
  if (t === 'romance') return 'romance'
  if (t === 'musical' || t === 'music') return 'musical'
  if (t === 'documentary') return 'documentary'
  if (t === 'thriller') return 'thriller'
  if (t === 'horror') return 'horror'
  return null
}

function splitGenres(genreField?: string): string[] {
  if (!genreField) return []
  return genreField.split(',').map(g => normalizeGenreToken(g)).filter((g): g is string => !!g)
}

function isValidPoster(url?: string): boolean {
  if (!url) return false
  const u = String(url)
  if (!u.startsWith('http')) return false
  if (u.includes('placeholder.com')) return false
  return true
}

export default function Categories() {
  const [grouped, setGrouped] = useState<Record<string, Movie[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function run() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('id,title,poster_url,genre,popularity')
          .order('popularity', { ascending: false })
          .range(0, 4999)
        if (error) throw error
        const map: Record<string, Movie[]> = {}
        ;(data || []).forEach((m: any) => {
          const tokens = splitGenres(m.genre)
          const movie: Movie = { id: Number(m.id), title: m.title, poster_url: m.poster_url, genre: m.genre, popularity: m.popularity }
          tokens.forEach(tok => {
            if (!map[tok]) map[tok] = []
            map[tok].push(movie)
          })
        })
        // sort lists by popularity desc then id desc
        Object.keys(map).forEach(k => {
          map[k].sort((a, b) => (Number(b.popularity||0) - Number(a.popularity||0)) || (b.id - a.id))
        })
        if (mounted) setGrouped(map)
      } catch (e) {
        console.error('Failed to load categories from Supabase:', e)
        if (mounted) setGrouped({})
      } finally { if (mounted) setLoading(false) }
    }
    run()
    return () => { mounted = false }
  }, [])

  const display = useMemo(() => {
    return categories.map(c => {
      const list = grouped[c.id] || []
      const posters = list.filter(m => isValidPoster(m.poster_url)).slice(0, 3).map(m => m.poster_url as string)
      const ids = list.slice(0, 3).map(m => m.id)
      return { ...c, posters, ids }
    })
  }, [grouped])

  return (
    <main className="max-w-[1280px] mx-auto p-8">
      <h1 className="mt-0 mb-10 text-2xl">Categories</h1>
      {loading && <p>Loading categories…</p>}
      <div className="grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {display.map(c => (
          <StackedCard key={c.id} id={c.id} name={c.name} posters={c.posters} />
        ))}
      </div>
    </main>
  )
}

function StackedCard({ id, name, posters }: { id: string; name: string; posters: string[] }) {
  const img1 = posters[0]
  const img2 = posters[1] ?? posters[0]
  const img3 = posters[2] ?? posters[1] ?? posters[0]
  const slug = id
  return (
    <Link to={`/category/${slug}`} className="no-underline text-inherit group">
      <div className="relative h-64 rounded-md">
        {img1 && (
          <img src={img1} alt="" className="absolute top-0 bottom-0 left-1/2 w-[160px] h-full object-cover rounded-lg opacity-70 -rotate-3 z-0" style={{ transform: 'translate(calc(-50% - 64px), 0)' }} />
        )}
        {img2 && (
          <img src={img2} alt="" className="absolute top-0 bottom-0 left-1/2 w-[160px] h-full object-cover rounded-lg shadow-lg z-10" style={{ transform: 'translate(-50%, 0)' }} />
        )}
        {img3 && (
          <img src={img3} alt="" className="absolute top-0 bottom-0 left-1/2 w-[160px] h-full object-cover rounded-lg rotate-3 ring-2 ring-transparent transition group-hover:ring-button z-20" style={{ transform: 'translate(calc(-50% + 64px), 0)' }} />
        )}
        <div className="absolute left-3 bottom-3 px-2 py-1 bg-black/45 rounded z-30">
          {name}
        </div>
      </div>
    </Link>
  )
}
