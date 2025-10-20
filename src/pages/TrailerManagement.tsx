import { useState } from 'react';
import { YouTubeTrailerService } from '../services/youtubeTrailerService';
import { TMDbTrailerService } from '../services/tmdbTrailerService';

export default function TrailerManagement() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<'youtube' | 'tmdb'>('tmdb');

  const updateSampleMovies = async () => {
    setIsUpdating(true);
    setProgress(`Starting to update first 10 movies using ${selectedService.toUpperCase()}...`);
    setResults(null);

    try {
      const result = selectedService === 'youtube' 
        ? await YouTubeTrailerService.updateAllMovies('movies', 10)
        : await TMDbTrailerService.updateAllMovies('movies', 10);
      
      setResults(result);
      setProgress('Update completed!');
    } catch (error) {
      setProgress('Error occurred during update');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateSpecificMovie = async () => {
    const movieId = prompt('Enter Movie ID to update:');
    if (!movieId) return;

    setIsUpdating(true);
    setProgress(`Updating movie ID: ${movieId} using ${selectedService.toUpperCase()}...`);

    try {
      const success = selectedService === 'youtube'
        ? await YouTubeTrailerService.updateMovieTrailer(parseInt(movieId))
        : await TMDbTrailerService.updateMovieTrailer(parseInt(movieId));
        
      setProgress(success ? 'Movie updated successfully!' : 'Failed to update movie');
    } catch (error) {
      setProgress('Error updating movie');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Movie Trailer Management</h1>
        
        {/* Service Selection */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Choose Service</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedService('tmdb')}
              className={`px-4 py-2 rounded-lg ${
                selectedService === 'tmdb' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              TMDb (Recommended)
            </button>
            <button
              onClick={() => setSelectedService('youtube')}
              className={`px-4 py-2 rounded-lg ${
                selectedService === 'youtube' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              YouTube Search
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">⚠️ Setup Required</h2>
          {selectedService === 'tmdb' ? (
            <div className="text-gray-300 space-y-2">
              <p>1. Get a free TMDb API key from <a href="https://www.themoviedb.org/settings/api" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">themoviedb.org</a></p>
              <p>2. Add it to your .env.local file as: <code className="bg-gray-700 px-2 py-1 rounded">VITE_TMDB_API_KEY=your_key_here</code></p>
              <p>3. TMDb allows 40 requests per 10 seconds (much more generous than YouTube)</p>
              <p>4. ✅ More accurate trailers - official data from movie studios</p>
              <p>5. ✅ Better success rate - has trailers for most movies</p>
            </div>
          ) : (
            <div className="text-gray-300 space-y-2">
              <p>1. Get a YouTube Data API key from Google Cloud Console</p>
              <p>2. Add it to your .env.local file as: <code className="bg-gray-700 px-2 py-1 rounded">VITE_YOUTUBE_API_KEY=your_key_here</code></p>
              <p>3. YouTube API has limits: 10,000 quota units per day (~1,000 searches)</p>
              <p>4. Each trailer search costs ~100 quota units</p>
              <p>5. ⚠️ Less reliable - searches can return incorrect videos</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Update */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🧪 Test Update</h3>
            <p className="text-gray-300 mb-4">Update first 10 movies as a test</p>
            <button
              onClick={updateSampleMovies}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
            >
              {isUpdating ? 'Updating...' : 'Update 10 Movies'}
            </button>
          </div>

          {/* Single Movie Update */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🎬 Single Movie</h3>
            <p className="text-gray-300 mb-4">Update trailer for a specific movie</p>
            <button
              onClick={updateSpecificMovie}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
            >
              {isUpdating ? 'Updating...' : 'Update Single Movie'}
            </button>
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold mb-2">📊 Progress</h3>
            <p className="text-gray-300">{progress}</p>
            {isUpdating && (
              <div className="mt-2">
                <div className="animate-pulse h-2 bg-blue-600 rounded"></div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold mb-2">✅ Results</h3>
            <div className="text-gray-300">
              <p>✅ Successful: {results.successCount}</p>
              <p>❌ Failed: {results.failureCount}</p>
              <p>📈 Success Rate: {Math.round((results.successCount / (results.successCount + results.failureCount)) * 100)}%</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">📋 How It Works</h3>
          {selectedService === 'tmdb' ? (
            <div className="text-gray-300 space-y-2">
              <p>1. <strong>Searches TMDb</strong> for the movie by title and year</p>
              <p>2. <strong>Gets official trailers</strong> from the movie's video collection</p>
              <p>3. <strong>Prefers official trailers</strong> over teasers or fan-made content</p>
              <p>4. <strong>Updates trailers table</strong> with the YouTube video ID</p>
              <p>5. <strong>Rate limited</strong> to 4 requests per second (TMDb limits)</p>
            </div>
          ) : (
            <div className="text-gray-300 space-y-2">
              <p>1. <strong>Searches YouTube</strong> for "[Movie Title] [Year] official trailer"</p>
              <p>2. <strong>Filters results</strong> to find videos with "trailer", "teaser", "preview", "official"</p>
              <p>3. <strong>Updates trailers table</strong> with the YouTube video ID</p>
              <p>4. <strong>Rate limited</strong> to 1 request per second to respect YouTube's limits</p>
            </div>
          )}
        </div>

        {/* Alternative Methods */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">🔄 Alternative Methods</h3>
          <div className="text-gray-300 space-y-3">
            <div>
              <strong>1. TMDb Integration:</strong> Use The Movie Database API (free) to get trailer data
            </div>
            <div>
              <strong>2. Manual CSV Import:</strong> Prepare a CSV file with movie_id,youtube_id pairs
            </div>
            <div>
              <strong>3. Batch Processing:</strong> Run overnight jobs to update trailers gradually
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}