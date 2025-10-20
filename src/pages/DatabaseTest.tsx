import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DatabaseTest() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testDatabase() {
      try {
        console.log('🔍 Testing database tables...');
        
        const [moviesResult, upcomingResult, newReleasesResult, trailersResult] = await Promise.all([
          supabase.from('movies').select('id, title').limit(5),
          supabase.from('upcoming_movies').select('id, title').limit(5),
          supabase.from('new_releases').select('id, title').limit(5),
          supabase.from('trailers').select('id, title').limit(5)
        ]);

        setResults({
          movies: { data: moviesResult.data, error: moviesResult.error },
          upcoming: { data: upcomingResult.data, error: upcomingResult.error },
          newReleases: { data: newReleasesResult.data, error: newReleasesResult.error },
          trailers: { data: trailersResult.data, error: trailersResult.error }
        });

      } catch (error) {
        console.error('Database test failed:', error);
        setResults({ error });
      } finally {
        setLoading(false);
      }
    }

    testDatabase();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Testing Database Connection...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Database Test Results</h1>
      
      {Object.entries(results).map(([tableName, result]: [string, any]) => (
        <div key={tableName} className="mb-6 p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-semibold mb-2 capitalize">{tableName} Table</h2>
          
          {result.error ? (
            <div className="text-red-400">
              <p>❌ Error: {result.error.message}</p>
            </div>
          ) : result.data ? (
            <div className="text-green-400">
              <p>✅ Found {result.data.length} records</p>
              {result.data.length > 0 && (
                <div className="mt-2">
                  <p className="text-gray-300">Sample data:</p>
                  <pre className="bg-gray-700 p-2 rounded mt-1 text-xs overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-yellow-400">
              <p>⚠️ No data returned</p>
            </div>
          )}
        </div>
      ))}

      <div className="mt-8">
        <a 
          href="/home" 
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white no-underline"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}