import { useParams } from 'react-router-dom'

export default function Movie() {
  const { id } = useParams()
  const videoId = id || ''
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`

  return (
    <main className="max-w-[1080px] mx-auto p-4">
      <div className="flex items-start gap-6 flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          <h1 className="mt-0 mb-2 text-3xl font-bold">Trailer</h1>
          <div className="relative w-full pt-[56.25%] rounded-md overflow-hidden shadow-2xl">
        {videoId ? (
          <iframe
            src={src}
            title="Trailer player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-white/10">
            <div className="text-muted">Invalid video</div>
          </div>
        )}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-2 rounded-sm bg-button text-[#1c1530] font-semibold">Add to Watchlist</button>
            <button className="px-3 py-2 rounded-sm bg-white/10 border border-white/10">Favorite</button>
          </div>
        </div>
        <aside className="w-full lg:w-80 shrink-0">
          <div className="text-lg font-semibold mb-2">Related</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface border border-white/10 rounded-md overflow-hidden">
                <div className="w-full h-[100px] bg-white/10" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}


