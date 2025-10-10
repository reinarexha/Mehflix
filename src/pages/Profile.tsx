import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const name = 'Guest User'
  const email = 'guest@example.com'

  return (
    <main className="max-w-[1280px] mx-auto p-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-[#2E236C] grid place-items-center text-2xl font-bold text-button">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold">{name.toLowerCase()}</div>
          <div className="text-muted">{email}</div>
        </div>
        <button className="px-4 py-2 rounded-sm bg-button text-[#1c1530] font-semibold">Log out</button>
      </header>
      <div className="border-b border-white/10 my-6" />

      {/* Sections */}
      <section className="mb-8">
        <h2 className="mt-0 mb-2 text-xl font-semibold">Watchlist</h2>
        <div className="text-muted">No items yet</div>
      </section>
      <section className="mb-8">
        <h2 className="mt-0 mb-2 text-xl font-semibold">Favorites</h2>
        <div className="text-muted">No favorites yet</div>
      </section>
      <section className="mb-8">
        <h2 className="mt-0 mb-2 text-xl font-semibold">Ratings</h2>
        <div className="text-muted">No ratings yet</div>
      </section>
      <section className="mb-8">
        <h2 className="mt-0 mb-2 text-xl font-semibold">Notifications</h2>
        <ul className="text-muted list-disc pl-6">
          <li>Reminder alerts will appear here.</li>
          <li>Likes and comments on your posts will appear here.</li>
        </ul>
      </section>

      {/* Account actions */}
      <section className="mt-10">
        <h2 className="mt-0 mb-4 text-xl font-semibold">Account</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="#" className="no-underline">
            <div className="rounded-md bg-[#2E236C] px-4 py-5 text-text text-center font-medium hover:shadow-xl transition">Change password</div>
          </Link>
          <Link to="#" className="no-underline">
            <div className="rounded-md bg-[#2E236C] px-4 py-5 text-text text-center font-medium hover:shadow-xl transition">Edit info</div>
          </Link>
          <Link to="#" className="no-underline">
            <div className="rounded-md bg-[#2E236C] px-4 py-5 text-text text-center font-medium hover:shadow-xl transition">Personal info</div>
          </Link>
        </div>
      </section>
    </main>
  )
}

