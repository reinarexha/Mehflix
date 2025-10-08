import { useParams } from 'react-router-dom'

export default function Movie() {
  const { id } = useParams()
  const videoId = id || ''
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`

  return (
    <main className="max-w-[960px] mx-auto p-4">
      <h1 className="mt-0">Trailer</h1>
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
      <p className="mt-3">Description and details will show here.</p>
    </main>
  )
}


