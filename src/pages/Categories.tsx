import { Link } from 'react-router-dom'

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

export default function Categories() {
  return (
    <main className="max-w-[1280px] mx-auto p-8">
  <h1 className="mt-0 mb-10 text-2xl">Categories</h1>
  <div className="grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
    {categories.map(c => (
      <StackedCard key={c.id} id={c.id} name={c.name} />
    ))}
  </div>
</main>

  )
}

function StackedCard({ id, name }: { id: string; name: string }) {
  // Load three posters from local assets for this category
  const posters = getCategoryPosters(id)
  const img1 = posters[0]
  const img2 = posters[1] ?? posters[0]
  const img3 = posters[2] ?? posters[1] ?? posters[0]
  const slug = id // use id for the category route

  return (
    <Link to={`/category/${slug}`} className="no-underline text-inherit group">
      <div className="relative h-64 rounded-md">
        {/* Three stacked posters (symmetrical, spaced) */}
        {img1 && (
          <img src={img1} alt="" className="absolute top-0 bottom-0 left-1/2 w-[160px] h-full object-cover rounded-lg opacity-70 -rotate-3 z-0" style={{ transform: 'translate(calc(-50% - 64px), 0)' }} />
        )}
        {img2 && (
          <img src={img2} alt="" className="absolute top-0 bottom-0 left-1/2 w-[160px] h-full object-cover rounded-lg shadow-lg z-10" style={{ transform: 'translate(-50%, 0)' }} />
        )}
        {img3 && (
          <img src={img3} alt="" className="absolute top-0 bottom-0 left-1/2 w-[160px] h-full object-cover rounded-lg rotate-3 ring-2 ring-transparent transition group-hover:ring-button z-20" style={{ transform: 'translate(calc(-50% + 64px), 0)' }} />
        )}
        {/* Category name (above posters) */}
        <div className="absolute left-3 bottom-3 px-2 py-1 bg-black/45 rounded z-30">
          {name}
        </div>
      </div>
    </Link>
  )
}

// Import all category images eagerly as URLs
const categoryImages = import.meta.glob('../assets/categories/**/*.{jpg,jpeg,jfif,png,webp}', { eager: true, as: 'url' }) as Record<string, string>

function getCategoryPosters(categoryId: string): string[] {
  const segment = `/assets/categories/${categoryId}/`
  const urls = Object.entries(categoryImages)
    .filter(([path]) => path.includes(segment))
    .map(([, url]) => url)
    .sort()
  return urls.slice(0, 3)
}
