import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

 type Movie = { id: number; title?: string; poster_url?: string; genre?: string; popularity?: number }

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

function normalizeSlug(slug: string) {
  return slug === 'sci-fi' ? 'scifi' : slug
}

function isValidPoster(url?: string): boolean {
  if (!url) return false
  const s = String(url)
  return s.startsWith('http') && !s.includes('placeholder.com')
}

export default function CategoryPage() {
  const { slug = 'category' } = useParams()
  const category = normalizeSlug(slug)
  const [list, setList] = useState<Movie[]>([])
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
          .range(0, 9999)
        if (error) throw error
        const items: Movie[] = []
        ;(data || []).forEach((m: any) => {
          const tokens = splitGenres(m.genre)
          if (tokens.includes(String(category))) {
            items.push({ id: Number(m.id), title: m.title, poster_url: m.poster_url, genre: m.genre, popularity: m.popularity })
          }
        })
        items.sort((a,b)=> (Number(b.popularity||0)-Number(a.popularity||0)) || (b.id-a.id))
        if (mounted) setList(items)
      } catch (e) {
        console.error('Failed to load category list:', e)
        if (mounted) setList([])
      } finally { if (mounted) setLoading(false) }
    }
    run()
    return () => { mounted = false }
  }, [category])

  const posters = useMemo(() => list.filter(m=>isValidPoster(m.poster_url)), [list])

  return (
    <main className="max-w-[1280px] mx-auto p-6">
      <h1 className="mt-0 mb-6 capitalize">{String(slug).replace('-', ' ')}</h1>
      {loading && <p>Loading movies…</p>}
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {posters.map((m) => (
          <Link key={m.id} to={`/movie/${m.id}`} className="no-underline text-inherit">
            <article className="bg-surface border border-white/10 rounded-md overflow-hidden hover:shadow-xl transition">
              <img src={m.poster_url!} alt={m.title || ''} className="w-full h-[240px] object-cover" />
            </article>
          </Link>
        ))}
      </div>
    </main>
  )
}
