import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import {
  toggleFavorite,
  toggleWatchlist,
  fetchFavorites,
  fetchWatchlist,
} from '../lib/data'
import type { Trailer } from '../lib/trailers'
import { supabase } from '../lib/supabaseClient'

type Movie = {
  id: number
  title?: string
  overview?: string
  release_date?: string
  poster_url?: string
  vote_average?: number
  vote_count?: number
  genre?: string
  popularity?: number
}

// Helper: relative date for New Releases
function relativeDate(from: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - from.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1d ago'
  if (diffDays < 7) return `${diffDays}d ago`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks === 1) return '1w ago'
  return `${diffWeeks}w ago`
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [comingSoonDb, setComingSoonDb] = useState<Movie[]>([])
  const [newReleasesDb, setNewReleasesDb] = useState<Movie[]>([])
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const { user, loading: userLoading } = useUser()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Fetch movies from Supabase
useEffect(() => {
  const fetchMovies = async () => {
    setLoading(true)

    try {
      console.log('🔄 Starting to fetch movies from Supabase...')
      
      // Try with trailers first, fallback to simple query if it fails
      let allMovies: any, comingSoon: any, newReleases: any;
      
      try {
        [allMovies, comingSoon, newReleases] = await Promise.all([
          supabase.from('movies').select(`
            *, 
            trailers(youtube_id)
          `).order('release_date', { ascending: false }).limit(100),
          supabase.from('upcoming_movies').select(`
            *, 
            trailers(youtube_id)
          `).order('release_date', { ascending: true }).limit(50),
          supabase.from('new_releases').select(`
            *, 
            trailers(youtube_id)
          `).order('release_date', { ascending: false }).limit(50),
        ])

        // PostgREST/Supabase sometimes returns an object with an .error
        // property instead of throwing — detect that and fallback.
        if (allMovies?.error || comingSoon?.error || newReleases?.error) {
          console.warn('⚠️ Embedded trailer select returned errors, falling back to simple selects', {
            allMoviesError: allMovies?.error,
            comingSoonError: comingSoon?.error,
            newReleasesError: newReleases?.error
          })

          const fallbackResults = await Promise.all([
            supabase.from('movies').select('*').order('release_date', { ascending: false }).limit(100),
            supabase.from('upcoming_movies').select('*').order('release_date', { ascending: true }).limit(50),
            supabase.from('new_releases').select('*').order('release_date', { ascending: false }).limit(50),
          ])
          allMovies = fallbackResults[0]
          comingSoon = fallbackResults[1]
          newReleases = fallbackResults[2]
        }
      } catch (error) {
        console.warn('⚠️ Trailer join failed, trying simple query:', error)
        // Fallback to simple queries without trailer joins
        const fallbackResults = await Promise.all([
          supabase.from('movies').select('*').order('release_date', { ascending: false }).limit(100),
          supabase.from('upcoming_movies').select('*').order('release_date', { ascending: true }).limit(50),
          supabase.from('new_releases').select('*').order('release_date', { ascending: false }).limit(50),
        ])
        allMovies = fallbackResults[0]
        comingSoon = fallbackResults[1]
        newReleases = fallbackResults[2]
      }

      console.log('📊 Raw query results:', {
        allMovies: { data: allMovies.data?.length, error: allMovies.error },
        comingSoon: { data: comingSoon.data?.length, error: comingSoon.error },
        newReleases: { data: newReleases.data?.length, error: newReleases.error }
      })

      if (allMovies.error) {
        console.error('❌ Error fetching movies:', allMovies.error)
        throw allMovies.error
      }
      if (comingSoon.error) {
        console.error('❌ Error fetching upcoming_movies:', comingSoon.error)
        throw comingSoon.error
      }
      if (newReleases.error) {
        console.error('❌ Error fetching new_releases:', newReleases.error)
        throw newReleases.error
      }

      console.log('🎬 Successfully loaded:', {
        movies: allMovies.data?.length || 0,
        comingSoon: comingSoon.data?.length || 0,
        newReleases: newReleases.data?.length || 0,
      })

      // Log sample data to see structure
      if (comingSoon.data && comingSoon.data.length > 0) {
        console.log('📝 Sample coming soon movie:', comingSoon.data[0])
      }
      if (newReleases.data && newReleases.data.length > 0) {
        console.log('📝 Sample new release movie:', newReleases.data[0])
      }

      setMovies(allMovies.data || [])
      setComingSoonDb(comingSoon.data || [])
      setNewReleasesDb(newReleases.data || [])
    } catch (err) {
      console.error('❌ Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  fetchMovies()
}, [])


    // Fetch Coming Soon and New Releases directly from DB
  useEffect(() => {
    const run = async () => {
      try {
        const today = new Date();
        const toStr = (d: Date) => d.toISOString().slice(0, 10);
        const todayStr = toStr(today);
        const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
        const agoStr = toStr(twoWeeksAgo);

        const [coming, releases] = await Promise.all([
          supabase
            .from('movies')
            .select('*')
            .gt('release_date', todayStr)
            .order('release_date', { ascending: true })
            .limit(20),
          supabase
            .from('movies')
            .select('*')
            .gte('release_date', agoStr)
            .lte('release_date', todayStr)
            .order('release_date', { ascending: false })
            .limit(20),
        ]);

        if (!coming.error && coming.data) setComingSoonDb(coming.data as Movie[]);
        if (!releases.error && releases.data) setNewReleasesDb(releases.data as Movie[]);
      } catch (e) {
        console.warn('Failed to fetch section lists', e);
      }
    };
    run();
  }, []);
// Initialize favorites/watchlist from server when user logs in
  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) {
        if (mounted) {
          setFavoriteIds(new Set())
          setWatchlistIds(new Set())
        }
        return
      }
      try {
        const favs = await fetchFavorites(user.id)
        const wls = await fetchWatchlist(user.id)
        if (!mounted) return
        setFavoriteIds(new Set(favs.map(t => t.id)))
        setWatchlistIds(new Set(wls.map(t => t.id)))
        console.log('â­ Loaded user data - Favorites:', favs.length, 'Watchlist:', wls.length)
      } catch (e) {
        console.error('Failed to load favorites/watchlist', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [user])

  // Store timeouts as refs to avoid any type casting
  const toastTimers = {
    hideTimer: 0,
    removeTimer: 0
  }

  const showToast = (message: string) => {
    setToast(message)
    setToastVisible(true)
    
    // Clear existing timers
    window.clearTimeout(toastTimers.hideTimer)
    window.clearTimeout(toastTimers.removeTimer)
    
    // Set new timers
    toastTimers.hideTimer = window.setTimeout(() => setToastVisible(false), 5000)
    toastTimers.removeTimer = window.setTimeout(() => setToast(null), 5400)
  }

  // Filter for search
  const results = movies
    .filter(m => m.title?.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)

  // Filter sections (no duplicates)
  const popular = movies
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 10)

  const comingSoonLocal = movies
    .filter(m => m.release_date && new Date(m.release_date) > new Date() && !popular.some(p => p.id === m.id))
    .slice(0, 10)

  const newReleasesLocal = movies
    .filter(m => {
      if (!m.release_date) return false
      const d = new Date(m.release_date)
      const diff = (new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      return diff <= 14 && !popular.some(p => p.id === m.id)
    })
    .slice(0, 10)

  console.log('📋 Processed movie lists:', {
    totalMovies: movies.length,
    popular: popular.length,
    comingSoonDb: comingSoonDb.length,
    comingSoonLocal: comingSoonLocal.length,
    newReleasesDb: newReleasesDb.length,
    newReleasesLocal: newReleasesLocal.length
  })

  async function handleFavorite(id: number) {
    if (userLoading) return showToast('Checking sign-in statusâ€¦')
    if (!user) return showToast('Please sign in to favorite movies')
    
    const movie = movies.find(m => m.id === id)
    if (!movie) {
      console.error('âŒ Movie not found:', id)
      return showToast('Movie not found')
    }

    console.log('â­ Toggle favorite for movie:', movie.title, 'ID:', movie.id, 'Poster:', movie.poster_url)

    const next = new Set(favoriteIds)
    const isFav = next.has(id.toString())
    
    if (isFav) {
      next.delete(id.toString())
    } else {
      next.add(id.toString())
    }
    
    setFavoriteIds(next)

    try {
      // Validate poster URL
      let posterUrl = movie.poster_url || ''
      if (!posterUrl || posterUrl.includes('placeholder.com') || !posterUrl.startsWith('http')) {
        console.warn('âš ï¸ Invalid poster URL, using placeholder')
        posterUrl = 'https://via.placeholder.com/300x450/374151/FFFFFF?text=No+Poster'
      }

      // Create proper trailer object from the actual movie data
      const trailer: Trailer = {
        id: movie.id.toString(),
        title: movie.title || 'Unknown Title',
        youtube_id: movie.id.toString(),
        category: movie.genre || 'Unknown',
        poster_url: posterUrl
      }

      console.log('ðŸŽ¬ Creating trailer object:', {
        id: trailer.id,
        title: trailer.title,
        poster_url: trailer.poster_url
      })
      
      const result = await toggleFavorite(user.id, trailer)
      console.log('âœ… Favorite toggle result:', result)
      
      showToast(isFav ? 'Removed from Favorites' : 'Added to Favorites')
    } catch (error) {
      // Revert UI on error
      const revert = new Set(favoriteIds)
      setFavoriteIds(revert)
      console.error('âŒ Failed to update favorite:', error)
      showToast(`Failed to update favorite: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function handleWatchlist(id: number) {
    if (userLoading) return showToast('Checking sign-in statusâ€¦')
    if (!user) return showToast('Please sign in to manage watchlist')
    
    const movie = movies.find(m => m.id === id)
    if (!movie) {
      console.error('âŒ Movie not found:', id)
      return showToast('Movie not found')
    }

    console.log('ðŸ“º Toggle watchlist for movie:', movie.title, 'ID:', movie.id, 'Poster:', movie.poster_url)

    const next = new Set(watchlistIds)
    const inList = next.has(id.toString())
    
    if (inList) {
      next.delete(id.toString())
    } else {
      next.add(id.toString())
    }
    
    setWatchlistIds(next)

    try {
      // Validate poster URL
      let posterUrl = movie.poster_url || ''
      if (!posterUrl || posterUrl.includes('placeholder.com') || !posterUrl.startsWith('http')) {
        console.warn('âš ï¸ Invalid poster URL, using placeholder')
        posterUrl = 'https://via.placeholder.com/300x450/374151/FFFFFF?text=No+Poster'
      }

      // Create proper trailer object from the actual movie data
      const trailer: Trailer = {
        id: movie.id.toString(),
        title: movie.title || 'Unknown Title',
        youtube_id: movie.id.toString(),
        category: movie.genre || 'Unknown',
        poster_url: posterUrl
      }

      console.log('ðŸŽ¬ Creating trailer object:', {
        id: trailer.id,
        title: trailer.title,
        poster_url: trailer.poster_url
      })
      
      const result = await toggleWatchlist(user.id, trailer)
      console.log('âœ… Watchlist toggle result:', result)
      
      showToast(inList ? 'Removed from Watchlist' : 'Added to Watchlist')
    } catch (error) {
      // Revert UI on error
      const revert = new Set(watchlistIds)
      setWatchlistIds(revert)
      console.error('âŒ Failed to update watchlist:', error)
      showToast(`Failed to update watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) return <p className="text-white text-center">Loading movies from Supabase...</p>

  // If none of the movie lists have data, show the global empty state.
  const hasAnyMovies = (movies && movies.length) || (comingSoonDb && comingSoonDb.length) || (newReleasesDb && newReleasesDb.length)
  if (!hasAnyMovies) return <p className="text-white text-center">No movies found.</p>

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '1rem' }}>
      
      {/* Search */}
      <section style={{ position: 'relative', marginBottom: '1rem' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trailers..."
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'var(--color-input)',
            color: 'var(--color-text)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)'
          }}
        />
        {query && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '110%',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              overflow: 'hidden'
            }}
          >
            {results.length === 0 && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  color: 'var(--color-muted)'
                }}
              >
                No results
              </div>
            )}
            {results.map(r => (
              <Link
                key={r.id}
                to={`/movie/${r.id}`}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <img
                  src={r.poster_url}
                  alt={r.title}
                  width={40}
                  height={56}
                  style={{ borderRadius: 4, objectFit: 'cover' }}
                />
                <span>{r.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Sections */}
      <Section
        title="Popular Now"
        movies={popular}
        favoriteIds={favoriteIds}
        watchlistIds={watchlistIds}
        onFavorite={handleFavorite}
        onWatchlist={handleWatchlist}
      />

      <Section
        title="Coming Soon"
        movies={comingSoonDb.length ? comingSoonDb : comingSoonLocal}
        ctaLabel="Remind me"
        onRemind={(date) => showToast(`You'll be reminded when this movie releases on ${date}! `)}
        favoriteIds={favoriteIds}
        watchlistIds={watchlistIds}
        onFavorite={handleFavorite}
        onWatchlist={handleWatchlist}
      />

      <Section
        title="New Releases"
        movies={newReleasesDb.length ? newReleasesDb : newReleasesLocal}
        isRelative
        favoriteIds={favoriteIds}
        watchlistIds={watchlistIds}
        onFavorite={handleFavorite}
        onWatchlist={handleWatchlist}
      />

      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
          <div
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
              opacity: toastVisible ? 1 : 0,
              transition: 'opacity 300ms ease'
            }}
          >
            {toast}
          </div>
        </div>
      )}
    </main>
  )
}

// Section component
function Section({
  title, movies, ctaLabel, onRemind, isRelative, favoriteIds, watchlistIds, onFavorite, onWatchlist
}: {
  title: string
  movies: Movie[]
  ctaLabel?: string
  onRemind?: (date: string) => void
  isRelative?: boolean
  favoriteIds?: Set<string>
  watchlistIds?: Set<string>
  onFavorite?: (id: number) => void
  onWatchlist?: (id: number) => void
}) {
  console.log(`🎬 Section "${title}" received ${movies.length} movies:`, movies.map(m => ({ id: m.id, title: m.title })))
  
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>{title}</h2>
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollSnapType: 'x mandatory' }}>
        {movies.map((m) => {
          const release = m.release_date ? new Date(m.release_date) : new Date()
          const dateStr = release.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          return (
            <article key={m.id} style={{ flex: '0 0 160px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', overflow: 'hidden', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <Link to={`/movie/${m.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
                <img src={m.poster_url} alt={m.title ?? ''} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                <div style={isRelative ? { padding: '0.5rem 0.75rem', minHeight: 62, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } : { padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontWeight: 600, color: 'white' }}>{m.title ?? 'Untitled'}</div>
                  {isRelative ? (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{relativeDate(release)}</div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{dateStr}</div>
                  )}
                </div>
              </Link>
              {(onFavorite || onWatchlist) && (
                <div style={{ display: 'flex', alignItems: 'stretch', padding: '0 0 8px 0', margin: '0 8px' }}>
                  {onWatchlist && (
                    <button
                      title="Add to watchlist"
                      onClick={(e) => { e.preventDefault(); onWatchlist!(m.id) }}
                      style={{
                        flex: 1,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'transparent',
                        color: watchlistIds?.has(m.id.toString()) ? 'var(--color-button)' : 'var(--color-text)',
                        border: 'none',
                        borderRadius: '6px 0 0 6px',
                        padding: '10px 0',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1.75a10.25 10.25 0 1 0 0 20.5 10.25 10.25 0 0 0 0-20.5Zm0 18.5A8.25 8.25 0 1 1 12 3.75a8.25 8.25 0 0 1 0 16.5Z" />
                      </svg>
                    </button>
                  )}
                  {onFavorite && (
                    <button
                      title="Add to favorites"
                      onClick={(e) => { e.preventDefault(); onFavorite!(m.id) }}
                      style={{
                        flex: 1,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'transparent',
                        color: favoriteIds?.has(m.id.toString()) ? 'var(--color-button)' : 'var(--color-text)',
                        border: 'none',
                        borderRadius: '0 6px 6px 0',
                        padding: '10px 0',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27l5.18 3.73-1.64-6.03L21 9.24l-6.19-.53L12 3.5 9.19 8.71 3 9.24l5.46 5.73-1.64 6.03L12 17.27Z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              {ctaLabel && onRemind && (
                <button onClick={() => onRemind(m.release_date ?? '')} style={{ margin: 4, padding: '6px 4px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}>
                  {ctaLabel}
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}