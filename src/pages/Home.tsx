import { useState } from 'react'
import { Link } from 'react-router-dom'

type Movie = { id: string; title: string; poster: string; trailer: string; releaseDate?: string }

const moviesData: Movie[] = [
  // Popular Now (10)
  { id: '1', title: 'Tron: Ares', poster: 'https://m.media-amazon.com/images/M/MV5BZTMyMmYxMzQtNjFkZi00ZDFiLWE4NzQtMzI5NzE1ZjUxZTEzXkEyXkFqcGdeQXVyNDUzOTQ5MjY@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=TronAresTrailer' },
  { id: '2', title: 'Predator: Badlands', poster: 'https://m.media-amazon.com/images/M/MV5BZDI5ZDFiYzQtYzA1ZS00NjJlLWJkNjUtYmZkM2Q4MGJmZjYxXkEyXkFqcGdeQXVyNjQzOTk3Njk@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=PredatorBadlandsTrailer' },
  { id: '3', title: 'Kiss of the Spider Woman', poster: 'https://m.media-amazon.com/images/M/MV5BNWQwMGFmZjAtZjk0Yi00MjM2LWE2YmYtNzZjMTYyMWQyZjRhXkEyXkFqcGdeQXVyNTE1NjY5Mg@@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=KissOfTheSpiderWomanTrailer' },
  { id: '4', title: 'The Carpenter’s Son', poster: 'https://m.media-amazon.com/images/M/MV5BNzdiY2QwZGUtN2QwNy00NjBhLWFjYmUtMzg2ZDljNzcyMzEzXkEyXkFqcGdeQXVyNjc1NTYyMjg@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=TheCarpentersSonTrailer' },
  { id: '5', title: 'A House of Dynamite', poster: 'https://m.media-amazon.com/images/M/MV5BZmVjMDE4YmItZGM2Yy00OTU5LWIzOGMtY2I3ZTgwY2Y1NzU3XkEyXkFqcGdeQXVyNjQ1NjQwNTI@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=AHouseOfDynamiteTrailer' },
  { id: '6', title: 'Soul on Fire', poster: 'https://m.media-amazon.com/images/M/MV5BZGU2Y2FjM2QtNmI0Yy00YzMzLTk4NzQtZjdlMjUxZDM2NzY2XkEyXkFqcGdeQXVyNjk0NTAzOA@@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=SoulOnFireTrailer' },
  { id: '7', title: 'The Bride', poster: 'https://m.media-amazon.com/images/M/MV5BYzY2NDc2NzctMTE4OC00NzEwLTgxNDctNDYwNzBiNjY0ZTRkXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=TheBrideTrailer' },
  { id: '8', title: 'The Woman in Cabin 10', poster: 'https://m.media-amazon.com/images/M/MV5BM2QyZjY1NzAtNzQ0ZC00ZDE1LWE0NGItZTJjNDY0YjY4Mjk2XkEyXkFqcGdeQXVyNjY1MTg1MzQ@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=TheWomanInCabin10Trailer' },
  { id: '9', title: '8 Femmes', poster: 'https://m.media-amazon.com/images/M/MV5BMjAyNzkxNjYxNl5BMl5BanBnXkFtZTcwNzM4NTQxMQ@@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=8FemmesTrailer' },
  { id: '10', title: 'The Holy Mountain', poster: 'https://m.media-amazon.com/images/M/MV5BMTkxNzc4MjM3NV5BMl5BanBnXkFtZTgwNTMwNjkzMzE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=TheHolyMountainTrailer' },

  // Coming Soon (10)
  { id: '11', title: 'The Smashing Machine', poster: 'https://m.media-amazon.com/images/M/MV5BODkzMDk0OTctOTNmNy00MjU2LTk2NzctZDg0OTI5NDJiZDNiXkEyXkFqcGdeQXVyNjY5MTY0MjI@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=TheSmashingMachineTrailer', releaseDate: 'October 3, 2025' },
  { id: '12', title: 'After the Hunt', poster: 'https://m.media-amazon.com/images/M/MV5BMjI0MzM0NjktMTI5MS00NDA3LWFiNDItZTQ1YmY2YmM1M2RlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=AfterTheHuntTrailer', releaseDate: 'October 3, 2025' },
  { id: '13', title: 'Baaghi 4', poster: 'https://m.media-amazon.com/images/M/MV5BMTk5ODk5NjgxNF5BMl5BanBnXkFtZTgwNzU5NzQxNjE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=Baaghi4Trailer', releaseDate: 'September 5, 2025' },
  { id: '14', title: 'Sarkeet', poster: 'https://m.media-amazon.com/images/M/MV5BMTI0MzUyMzE2OV5BMl5BanBnXkFtZTcwNTc1MTkzMw@@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=SarkeetTrailer', releaseDate: 'May 8, 2025' },
  { id: '15', title: 'How to Train Your Dragon', poster: 'https://m.media-amazon.com/images/M/MV5BMTk0NzE4MjEyNF5BMl5BanBnXkFtZTgwMzEzNjQzNDE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=HowToTrainYourDragon2025Trailer', releaseDate: 'June 13, 2025' },
  { id: '16', title: 'Green Lantern', poster: 'https://m.media-amazon.com/images/M/MV5BMTQ5MjQ5Mjg5N15BMl5BanBnXkFtZTcwNjU3NjQ1OA@@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=GreenLantern2025Trailer', releaseDate: 'July 15, 2025' },
  { id: '17', title: 'Lilo & Stitch Live Action', poster: 'https://m.media-amazon.com/images/M/MV5BMTk2MjAxODU3Nl5BMl5BanBnXkFtZTgwNTYzOTUzNzM@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=LiloStitchLiveActionTrailer', releaseDate: 'August 20, 2025' },
  { id: '18', title: 'Jurassic World 4: Extinction', poster: 'https://m.media-amazon.com/images/M/MV5BMTU1NjI2MDU3OV5BMl5BanBnXkFtZTgwODc3NzM3MzE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=JurassicWorld4ExtinctionTrailer', releaseDate: 'September 25, 2025' },
  { id: '19', title: 'Captain America: Brave New World', poster: 'https://m.media-amazon.com/images/M/MV5BMTQyMzU4Nzk2M15BMl5BanBnXkFtZTgwNzI1MTYyMzE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=CaptainAmericaBraveNewWorldTrailer', releaseDate: 'October 15, 2025' },
  { id: '20', title: 'The Invisible Force', poster: 'https://m.media-amazon.com/images/M/MV5BMjI1NzE1MzU5NV5BMl5BanBnXkFtZTgwNzc1NzE1NzE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=TheInvisibleForceTrailer', releaseDate: 'November 1, 2025' },

  // New Releases (10)
  { id: '21', title: 'Roofman', poster: 'https://m.media-amazon.com/images/M/MV5BMTYyMzI1MzEzOV5BMl5BanBnXkFtZTgwNjk3NzEyMTE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=RoofmanTrailer' },
  { id: '22', title: 'Kambi Katna Kathai', poster: 'https://m.media-amazon.com/images/M/MV5BMTYyMzQ1MjMyNF5BMl5BanBnXkFtZTgwNjk0Nzk1MDE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=KambiKatnaKathaiTrailer' },
  { id: '23', title: 'The Ballad of a Small Player', poster: 'https://m.media-amazon.com/images/M/MV5BMTU4Njk0NjYyMF5BMl5BanBnXkFtZTgwNzQ1NzE5MTE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=TheBalladOfASmallPlayerTrailer' },
  { id: '24', title: 'Mr. K', poster: 'https://m.media-amazon.com/images/M/MV5BMTU5MzU2NjkyOV5BMl5BanBnXkFtZTgwNjU3Nzg1MTE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=MrKTrailer' },
  { id: '25', title: 'Dear Luke, Love, Me', poster: 'https://m.media-amazon.com/images/M/MV5BMjQ1NjQyNzE2M15BMl5BanBnXkFtZTgwNzY0NzU3MjE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=DearLukeLoveMeTrailer' },
  { id: '26', title: 'Springsteen: Deliver Me From Nowhere', poster: 'https://m.media-amazon.com/images/M/MV5BMTk2NzQ0NzUzNl5BMl5BanBnXkFtZTgwNjc2NjYzNzE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=SpringsteenDeliverMeFromNowhereTrailer' },
  { id: '27', title: 'Soul on Fire', poster: 'https://m.media-amazon.com/images/M/MV5BZGU2Y2FjM2QtNmI0Yy00YzMzLTk4NzQtZjdlMjUxZDM2NzY2XkEyXkFqcGdeQXVyNjk0NTAzOA@@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=SoulOnFireTrailer' },
  { id: '28', title: 'Re-Election', poster: 'https://m.media-amazon.com/images/M/MV5BMTk5NjM0NzUzNF5BMl5BanBnXkFtZTgwNzU1NzE5MTE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=ReElectionTrailer' },
  { id: '29', title: 'Caramelo', poster: 'https://m.media-amazon.com/images/M/MV5BMTg1NjI0NjUzNl5BMl5BanBnXkFtZTgwNjY1NjQ1NTE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=CarameloTrailer' },
  { id: '30', title: 'Bugonia', poster: 'https://m.media-amazon.com/images/M/MV5BMjI2NjQ0NzUzNF5BMl5BanBnXkFtZTgwNzQ1NzE5MTE@._V1_.jpg', trailer: 'https://www.youtube.com/watch?v=BugoniaTrailer' }
]

export default function Home() {
  const [query, setQuery] = useState('')
  const results = moviesData.filter(m => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
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

      <Section title="Popular Now" movies={moviesData.slice(0, 10)} />
      <Section title="Coming Soon" movies={moviesData.slice(10, 20)} ctaLabel="Remind me" onRemind={(date) => showToast(`You’ll be reminded when this movie releases on ${date}! 🍿`)} />
      <Section title="New Releases" movies={moviesData.slice(20, 30)} />

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
          const release = m.releaseDate ? new Date(m.releaseDate) : undefined
          const dateStr = release?.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          return (
            <article key={m.id} style={{ flex: '0 0 160px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', overflow: 'hidden', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column' }}>
              <Link to={`/movie/${m.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
                <img src={m.poster} alt={m.title} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  {m.releaseDate && <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{dateStr}</div>}
                </div>
              </Link>
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
