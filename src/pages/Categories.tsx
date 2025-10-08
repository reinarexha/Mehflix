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
    <main className="max-w-[1280px] mx-auto p-4">
      <h1 className="mt-0">Categories</h1>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {categories.map(c => (
          <StackedCard key={c.id} id={c.id} name={c.name} />
        ))}
      </div>
    </main>
  )
}

function StackedCard({ id, name }: { id: string; name: string }) {
  // Dynamically load the category poster from assets/categories
  const img = new URL(`../assets/categories/${id}.jpg`, import.meta.url).href
  const slug = id // use id for the category route

  return (
    <Link to={`/category/${slug}`} className="no-underline text-inherit">
      <div className="relative h-60 rounded-md overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/0 border border-white/10" />
        <div className="absolute inset-0 opacity-60 blur-[1px] -rotate-2 scale-[0.98]" style={{
          backgroundImage: `url(${img})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
        <div className="stacked-hover absolute inset-0 transition-transform duration-200 ease-out shadow-lg outline-2 outline-transparent" style={{
          backgroundImage: `url(${img})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
        {/* Category name */}
        <div className="absolute left-3 bottom-3 px-2 py-1 bg-black/45 rounded focus-within:ring-2 focus-within:ring-button">
          {name}
        </div>

        <style>{`
          .stacked-hover {
            transform: translate(10px, -10px) scale(0.96);
            box-shadow: 0 8px 18px rgba(0,0,0,0.35);
          }
          .stacked-hover:hover {
            transform: translate(-6px, -16px) scale(1.08);
            box-shadow: 0 24px 40px rgba(0,0,0,0.5);
            outline-color: rgb(46 35 108);
            z-index: 10;
          }
        `}</style>
      </div>
    </Link>
  )
}
