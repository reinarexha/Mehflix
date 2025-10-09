type Props = { movie: any };

export default function MovieCard({ movie }: Props) {
  return (
    <div className="rounded-lg overflow-hidden shadow-lg bg-gray-900 text-white">
      <img
        src={movie.poster_url}
        alt={movie.title}
        className="h-64 w-full object-cover"
      />
      <div className="p-3">
        <h3 className="font-semibold text-lg">{movie.title}</h3>
        <p className="text-sm text-gray-300">{movie.description}</p>
        <p className="text-xs text-gray-400 mt-2">
          Released {new Date(movie.release_date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
