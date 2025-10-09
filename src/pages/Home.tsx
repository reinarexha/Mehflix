import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { toggleFavorite, toggleWatchlist } from '../lib/data'

// Import all posters
import poster1 from '../assets/posters/id1.jpg'
import poster2 from '../assets/posters/id2.jpg'
import poster3 from '../assets/posters/id3.jpg'
import poster4 from '../assets/posters/id4.jpg'
import poster5 from '../assets/posters/id5.jpg'
import poster6 from '../assets/posters/id6.jpg'
import poster7 from '../assets/posters/id7.jpg'
import poster8 from '../assets/posters/id8.webp'
import poster9 from '../assets/posters/id9.jpg'
import poster10 from '../assets/posters/id10.jpg'
import poster11 from '../assets/posters/id11.webp'
import poster12 from '../assets/posters/id12.jpg'
import poster13 from '../assets/posters/id13.webp'
import poster14 from '../assets/posters/id14.jpg'
import poster15 from '../assets/posters/id15.jpg'
import poster16 from '../assets/posters/id16.jpg'
import poster17 from '../assets/posters/id17.jpg'
import poster18 from '../assets/posters/id18.jpg'
import poster19 from '../assets/posters/id19.jpg'
import poster20 from '../assets/posters/id20.jpg'
import poster21 from '../assets/posters/id21.jpg'
import poster22 from '../assets/posters/id22.jpg'
import poster23 from '../assets/posters/id23.webp'
import poster24 from '../assets/posters/id24.jpg'
import poster25 from '../assets/posters/id25.jpg'
import poster26 from '../assets/posters/id26.jpg'
import poster27 from '../assets/posters/id27.jpg'
import poster28 from '../assets/posters/id28.jpg'
import poster29 from '../assets/posters/id29.jpg'
import poster30 from '../assets/posters/id30.jpg'

type Movie = {
  id: string
  title: string
  poster: string
  trailer: string
  releaseDate?: string
}

// All movies with imported posters
const moviesData: Movie[] = [
  { id: '1', title: 'Tron: Ares', poster: poster1, trailer: 'https://www.youtube.com/watch?v=TronAresTrailer' },
  { id: '2', title: 'Predator: Badlands', poster: poster2, trailer: 'https://www.youtube.com/watch?v=PredatorBadlandsTrailer' },
  { id: '3', title: 'Kiss of the Spider Woman', poster: poster3, trailer: 'https://www.youtube.com/watch?v=KissOfTheSpiderWomanTrailer' },
  { id: '4', title: 'The Carpenter’s Son', poster: poster4, trailer: 'https://www.youtube.com/watch?v=TheCarpentersSonTrailer' },
  { id: '5', title: 'A House of Dynamite', poster: poster5, trailer: 'https://www.youtube.com/watch?v=AHouseOfDynamiteTrailer' },
  { id: '6', title: 'Soul on Fire', poster: poster6, trailer: 'https://www.youtube.com/watch?v=SoulOnFireTrailer' },
  { id: '7', title: 'The Bride', poster: poster7, trailer: 'https://www.youtube.com/watch?v=TheBrideTrailer' },
  { id: '8', title: 'The Woman in Cabin 10', poster: poster8, trailer: 'https://www.youtube.com/watch?v=TheWomanInCabin10Trailer' },
  { id: '9', title: '8 Femmes', poster: poster9, trailer: 'https://www.youtube.com/watch?v=8FemmesTrailer' },
  { id: '10', title: 'The Holy Mountain', poster: poster10, trailer: 'https://www.youtube.com/watch?v=TheHolyMountainTrailer' },

  // Coming Soon (future releases)
  { id: '11', title: 'The Smashing Machine', poster: poster11, trailer: 'https://www.youtube.com/watch?v=TheSmashingMachineTrailer' },
  { id: '12', title: 'After the Hunt', poster: poster12, trailer: 'https://www.youtube.com/watch?v=AfterTheHuntTrailer' },
  { id: '13', title: 'Baaghi 4', poster: poster13, trailer: 'https://www.youtube.com/watch?v=Baaghi4Trailer' },
  { id: '14', title: 'Sarkeet', poster: poster14, trailer: 'https://www.youtube.com/watch?v=SarkeetTrailer' },
  { id: '15', title: 'How to Train Your Dragon', poster: poster15, trailer: 'https://www.youtube.com/watch?v=HowToTrainYourDragon2025Trailer' },
  { id: '16', title: 'Green Lantern', poster: poster16, trailer: 'https://www.youtube.com/watch?v=GreenLantern2025Trailer' },
  { id: '17', title: 'Lilo & Stitch Live Action', poster: poster17, trailer: 'https://www.youtube.com/watch?v=LiloStitchLiveActionTrailer' },
  { id: '18', title: 'Jurassic World 4: Extinction', poster: poster18, trailer: 'https://www.youtube.com/watch?v=JurassicWorld4ExtinctionTrailer' },
  { id: '19', title: 'Captain America: Brave New World', poster: poster19, trailer: 'https://www.youtube.com/watch?v=CaptainAmericaBraveNewWorldTrailer' },
  { id: '20', title: 'The Invisible Force', poster: poster20, trailer: 'https://www.youtube.com/watch?v=TheInvisibleForceTrailer' },

  // New Releases (released within last 2 weeks)
  { id: '21', title: 'Roofman', poster: poster21, trailer: 'https://www.youtube.com/watch?v=RoofmanTrailer' },
  { id: '22', title: 'Kambi Katna Kathai', poster: poster22, trailer: 'https://www.youtube.com/watch?v=KambiKatnaKathaiTrailer' },
  { id: '23', title: 'The Ballad of a Small Player', poster: poster23, trailer: 'https://www.youtube.com/watch?v=TheBalladOfASmallPlayerTrailer' },
  { id: '24', title: 'Mr. K', poster: poster24, trailer: 'https://www.youtube.com/watch?v=MrKTrailer' },
  { id: '25', title: 'Dear Luke, Love, Me', poster: poster25, trailer: 'https://www.youtube.com/watch?v=DearLukeLoveMeTrailer' },
  { id: '26', title: 'Springsteen: Deliver Me From Nowhere', poster: poster26, trailer: 'https://www.youtube.com/watch?v=SpringsteenDeliverMeFromNowhereTrailer' },
  { id: '27', title: 'Soul on Fire', poster: poster27, trailer: 'https://www.youtube.com/watch?v=SoulOnFireTrailer' },
  { id: '28', title: 'Re-Election', poster: poster28, trailer: 'https://www.youtube.com/watch?v=ReElectionTrailer' },
  { id: '29', title: 'Caramelo', poster: poster29, trailer: 'https://www.youtube.com/watch?v=CarameloTrailer' },
  { id: '30', title: 'Bugonia', poster: poster30, trailer: 'https://www.youtube.com/watch?v=BugoniaTrailer' }
]

// --- Helper for relative date strings ---
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

// Assign release dates for Coming Soon (future: 2–6 weeks later)
const comingSoonIndices = Array.from({ length: 10 }, (_, i) => 10 + i)
const futureOffsets = [14, 21, 28, 35, 18, 24, 31, 42, 20, 38] // days from now
comingSoonIndices.forEach((idx, i) => {
  const date = new Date()
  date.setDate(date.getDate() + futureOffsets[i])
  moviesData[idx].releaseDate = date.toISOString()
})

// Assign release dates for New Releases (past 14 days)
const newReleasesIndices = Array.from({ length: 10 }, (_, i) => 20 + i)
const releaseOffsets = [2, 5, 1, 3, 7, 10, 4, 6, 12, 9] // days ago
newReleasesIndices.forEach((idx, i) => {
  const date = new Date()
  date.setDate(date.getDate() - releaseOffsets[i])
  moviesData[idx].releaseDate = date.toISOString()
})

export default function Home() {
  const [query, setQuery] = useState('')
  const results = moviesData.filter(m => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
  const [toast, setToast] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const { user } = useUser()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set())

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
      {/* Search */}
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
                <img src={r.poster} alt={r.title} width={40} height={56} style={{ borderRadius: 4, objectFit: 'cover' }} />
                <span>{r.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Section
        title="Popular Now"
        movies={moviesData.slice(0, 10)}
        favoriteIds={favoriteIds}
        watchlistIds={watchlistIds}
        onFavorite={async (id) => {
          if (!user) return showToast('Please sign in to favorite movies')
          const next = new Set(favoriteIds)
          const isFav = next.has(id)
          if (isFav) next.delete(id); else next.add(id)
          setFavoriteIds(next)
          try { await toggleFavorite(user.id, id) } catch (e: any) { showToast(`Failed to update favorite: ${e?.message ?? 'error'}`); const revert = new Set(next); isFav ? revert.add(id) : revert.delete(id); setFavoriteIds(revert) }
        }}
        onWatchlist={async (id) => {
          if (!user) return showToast('Please sign in to manage watchlist')
          const next = new Set(watchlistIds)
          const inList = next.has(id)
          if (inList) next.delete(id); else next.add(id)
          setWatchlistIds(next)
          try { await toggleWatchlist(user.id, id) } catch (e: any) { showToast(`Failed to update watchlist: ${e?.message ?? 'error'}`); const revert = new Set(next); inList ? revert.add(id) : revert.delete(id); setWatchlistIds(revert) }
        }}
      />
      <Section
        title="Coming Soon"
        movies={moviesData.slice(10, 20)}
        ctaLabel="Remind me"
        onRemind={(date) => showToast(`You’ll be reminded when this movie releases on ${date}! 🍿`)}
        favoriteIds={favoriteIds}
        watchlistIds={watchlistIds}
        onFavorite={async (id) => {
          if (!user) return showToast('Please sign in to favorite movies')
          const next = new Set(favoriteIds)
          const isFav = next.has(id)
          if (isFav) next.delete(id); else next.add(id)
          setFavoriteIds(next)
          try { await toggleFavorite(user.id, id) } catch (e: any) { showToast(`Failed to update favorite: ${e?.message ?? 'error'}`); const revert = new Set(next); isFav ? revert.add(id) : revert.delete(id); setFavoriteIds(revert) }
        }}
        onWatchlist={async (id) => {
          if (!user) return showToast('Please sign in to manage watchlist')
          const next = new Set(watchlistIds)
          const inList = next.has(id)
          if (inList) next.delete(id); else next.add(id)
          setWatchlistIds(next)
          try { await toggleWatchlist(user.id, id) } catch (e: any) { showToast(`Failed to update watchlist: ${e?.message ?? 'error'}`); const revert = new Set(next); inList ? revert.add(id) : revert.delete(id); setWatchlistIds(revert) }
        }}
      />
      <Section
        title="New Releases"
        movies={moviesData.slice(20, 30)}
        isRelative
        favoriteIds={favoriteIds}
        watchlistIds={watchlistIds}
        onFavorite={async (id) => {
          if (!user) return showToast('Please sign in to favorite movies')
          const next = new Set(favoriteIds)
          const isFav = next.has(id)
          if (isFav) next.delete(id); else next.add(id)
          setFavoriteIds(next)
          try { await toggleFavorite(user.id, id) } catch (e: any) { showToast(`Failed to update favorite: ${e?.message ?? 'error'}`); const revert = new Set(next); isFav ? revert.add(id) : revert.delete(id); setFavoriteIds(revert) }
        }}
        onWatchlist={async (id) => {
          if (!user) return showToast('Please sign in to manage watchlist')
          const next = new Set(watchlistIds)
          const inList = next.has(id)
          if (inList) next.delete(id); else next.add(id)
          setWatchlistIds(next)
          try { await toggleWatchlist(user.id, id) } catch (e: any) { showToast(`Failed to update watchlist: ${e?.message ?? 'error'}`); const revert = new Set(next); inList ? revert.add(id) : revert.delete(id); setWatchlistIds(revert) }
        }}
      />

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

function Section({ title, movies, ctaLabel, onRemind, isRelative, favoriteIds, watchlistIds, onFavorite, onWatchlist }: {
  title: string;
  movies: Movie[];
  ctaLabel?: string;
  onRemind?: (date: string) => void;
  isRelative?: boolean;
  favoriteIds?: Set<string>;
  watchlistIds?: Set<string>;
  onFavorite?: (id: string) => void;
  onWatchlist?: (id: string) => void;
}) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>{title}</h2>
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollSnapType: 'x mandatory' }}>
        {movies.map((m) => {
          const release = m.releaseDate ? new Date(m.releaseDate) : undefined
          const dateStr = release?.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          return (
            <article key={m.id} style={{ flex: '0 0 160px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', overflow: 'hidden', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <Link to={`/movie/${m.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
                <img src={m.poster} alt={m.title} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  {m.releaseDate && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                      {isRelative ? relativeDate(new Date(m.releaseDate)) : dateStr}
                    </div>
                  )}
                </div>
              </Link>
              {(onFavorite || onWatchlist) && (
                <div style={{ display: 'flex', gap: 8, padding: '0 12px 12px' }}>
                  {onWatchlist && (
                    <button title="Watchlist" onClick={(e) => { e.preventDefault(); onWatchlist(m.id) }} style={{
                      flex: 1,
                      background: watchlistIds?.has(m.id) ? 'var(--color-button)' : 'rgba(255,255,255,0.08)',
                      color: watchlistIds?.has(m.id) ? '#1c1530' : 'var(--color-text)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '8px 10px', fontWeight: 600
                    }}>Watchlist</button>
                  )}
                  {onFavorite && (
                    <button title="Favorite" onClick={(e) => { e.preventDefault(); onFavorite(m.id) }} style={{
                      width: 40,
                      background: favoriteIds?.has(m.id) ? 'var(--color-button)' : 'rgba(255,255,255,0.08)',
                      color: favoriteIds?.has(m.id) ? '#1c1530' : 'var(--color-text)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '8px 0', fontWeight: 700
                    }}>★</button>
                  )}
                </div>
              )}
              {ctaLabel && (
                <div style={{ padding: '0 0.75rem 0.75rem' }}>
                  <button style={{
                    width: '100%',
                    background: 'var(--color-button)', color: '#1c1530', border: 'none',
                    borderRadius: 'var(--radius-sm)', padding: '0.5rem 0', fontWeight: 600
                  }} onClick={() => onRemind && onRemind(dateStr!)}>{ctaLabel}</button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
