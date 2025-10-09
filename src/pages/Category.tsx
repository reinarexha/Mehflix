import { Link, useParams } from 'react-router-dom'

export default function CategoryPage() {
  const { slug = 'category' } = useParams()
  const folder = mapSlugToFolder(slug)
  const posters = getAllCategoryPosters(folder)
  const ids = posters.map((_, i) => demoYouTubeIds[i % demoYouTubeIds.length])

  return (
    <main className="max-w-[1280px] mx-auto p-6">
      <h1 className="mt-0 mb-6 capitalize">{slug.replace('-', ' ')}</h1>
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {posters.map((src, idx) => (
          <Link key={idx} to={`/movie/${ids[idx]}`} className="no-underline text-inherit">
            <article className="bg-surface border border-white/10 rounded-md overflow-hidden hover:shadow-xl transition">
              <img src={src} alt="" className="w-full h-[240px] object-cover" />
            </article>
          </Link>
        ))}
      </div>
    </main>
  )
}

// Eagerly import all images in categories folders as URLs
const categoryImages = import.meta.glob('../assets/categories/**/*.{jpg,jpeg,jfif,png,webp}', { eager: true, as: 'url' }) as Record<string, string>

function mapSlugToFolder(slug: string) {
  if (slug === 'scifi' || slug === 'sci-fi') return 'sci-fi'
  return slug
}

function getAllCategoryPosters(folder: string): string[] {
  const target = normalize(folder)
  return Object.entries(categoryImages)
    .filter(([path]) => {
      const match = path.match(/\/assets\/categories\/([^/]+)\//)
      const dir = match?.[1] ?? ''
      return normalize(dir) === target
    })
    .map(([, url]) => url)
    .sort()
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Demo IDs to make posters clickable to trailer page
const demoYouTubeIds = [
  'dQw4w9WgXcQ', '3JZ_D3ELwOQ', 'hY7m5jjJ9mM', 'kxopViU98Xo', '9bZkp7q19f0',
  'tVj0ZTS4WF4', 'CevxZvSJLk8', 'RgKAFK5djSk', 'OPf0YbXqDm0', '60ItHLz5WEA'
]


