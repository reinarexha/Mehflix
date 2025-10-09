type Props = {
  movie: any;
  userId: string;
  onRemoveFavorite?: (movieId: number) => void;
  onRemoveWatchlist?: (movieId: number) => void;
};

export default function MovieCard({
  movie,
  userId: _userId,
  onRemoveFavorite,
  onRemoveWatchlist,
}: Props) {

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

        {onRemoveFavorite && (
          <button
            className="mt-2 text-red-500 hover:underline"
            onClick={() => onRemoveFavorite(movie.id)}
          >
            Remove from Favorites
          </button>
        )}

        {onRemoveWatchlist && (
          <button
            className="mt-2 text-yellow-500 hover:underline"
            onClick={() => onRemoveWatchlist(movie.id)}
          >
            Remove from Watchlist
          </button>
        )}
      </div>
    </div>
  );
}
