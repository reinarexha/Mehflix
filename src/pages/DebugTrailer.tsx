import React, { useState } from 'react';
import { TMDbTrailerService } from '../services/tmdbTrailerService';

export default function DebugTrailer() {
  const [result, setResult] = useState('');

  const testAPI = async () => {
    setResult('Testing...');
    try {
      // Test environment variable
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;
      console.log('🔑 API Key from env:', apiKey ? 'Present' : 'Missing');
      setResult(`API Key: ${apiKey ? 'Present' : 'Missing'}\n`);

      // Test direct API call
      const testResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=Spider-Man`);
      const testData = await testResponse.json();
      
      setResult(prev => prev + `\nDirect API Test: ${testResponse.status}\n`);
      setResult(prev => prev + `Results: ${testData.results?.length || 0} movies\n`);

      // Test our service
      const movie = await TMDbTrailerService.searchMovie('Spider-Man: No Way Home', '2021');
      setResult(prev => prev + `\nService Test: ${movie ? movie.title : 'Failed'}\n`);

      if (movie) {
        const trailer = await TMDbTrailerService.getMovieVideos(movie.id);
        setResult(prev => prev + `Trailer ID: ${trailer || 'None found'}\n`);
      }

    } catch (error) {
      setResult(prev => prev + `\nError: ${error.message}`);
      console.error('Test error:', error);
    }
  };

  const testUpdateMovie = async () => {
    setResult('Testing movie update...');
    try {
      const success = await TMDbTrailerService.updateMovieTrailer(1);
      setResult(`Update result: ${success ? 'Success!' : 'Failed'}`);
    } catch (error) {
      setResult(`Update error: ${error.message}`);
      console.error('Update error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Debug Trailer System</h1>
        
        <div className="space-x-4 mb-6">
          <button 
            onClick={testAPI}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Test API
          </button>
          <button 
            onClick={testUpdateMovie}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Test Update Movie 1
          </button>
        </div>

        <div className="bg-gray-800 rounded p-4">
          <h3 className="font-semibold mb-2">Results:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <p>Check browser console (F12) for detailed logs</p>
        </div>
      </div>
    </div>
  );
}