import { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import type { Trailer } from "../lib/trailers"; // Type-only import
import { fetchFavorites, toggleFavorite, normalizePosterUrl } from "../lib/data";
import { getMovieById } from "../lib/trailers"; // Import the actual functions

const FavoritesList = () => {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userFavorites = await fetchFavorites(user.id);
        setFavorites(userFavorites);
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user?.id]);

  const handleRemoveFavorite = async (trailerId: string) => {
    if (!user?.id) return;

    try {
      // Get the trailer first
      const trailer = await getMovieById(trailerId);
      if (!trailer) {
        console.error("Trailer not found:", trailerId);
        return;
      }

      // Toggle favorite to remove it
      await toggleFavorite(user.id, trailer);
      
      // Update local state
      setFavorites(prev => prev.filter(t => t.id !== trailerId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No favorites yet. Start adding some movies to your favorites!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {favorites.map((trailer) => (
        <div key={trailer.id} className="relative group">
          <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={normalizePosterUrl(trailer.poster_url)}
              alt={trailer.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `data:image/svg+xml;base64,${btoa(`
                  <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#374151"/>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
                          font-family="Arial, sans-serif" font-size="16" fill="white">
                      No Poster
                    </text>
                  </svg>
                `)}`;
              }}
            />
          </div>
          
          <div className="mt-2">
            <h3 className="font-semibold text-white text-sm truncate">
              {trailer.title}
            </h3>
            <p className="text-gray-400 text-xs">{trailer.category}</p>
          </div>

          {/* Remove button */}
          <button
            onClick={() => handleRemoveFavorite(trailer.id)}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove from favorites"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default FavoritesList;