import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DatabaseTest() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testDatabase = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🧪 Starting database tests...');
        
        // Test 1: Check if movies table exists and has data
        const moviesResult = await supabase
          .from('movies')
          .select('*', { count: 'exact', head: true });
        
        // Test 2: Try to get actual movie data
        const moviesData = await supabase
          .from('movies')
          .select('id, title, release_date')
          .limit(5);
        
        // Test 3: Check trailers table
        const trailersResult = await supabase
          .from('trailers')
          .select('*', { count: 'exact', head: true });
        
        // Test 4: Check upcoming_movies table
        const upcomingResult = await supabase
          .from('upcoming_movies')
          .select('*', { count: 'exact', head: true });
        
        // Test 5: Check new_releases table
        const newReleasesResult = await supabase
          .from('new_releases')
          .select('*', { count: 'exact', head: true });

        const testResults = {
          movies: {
            count: moviesResult.count,
            error: moviesResult.error?.message,
            data: moviesData.data,
            dataError: moviesData.error?.message
          },
          trailers: {
            count: trailersResult.count,
            error: trailersResult.error?.message
          },
          upcoming_movies: {
            count: upcomingResult.count,
            error: upcomingResult.error?.message
          },
          new_releases: {
            count: newReleasesResult.count,
            error: newReleasesResult.error?.message
          }
        };

        console.log('📊 Test results:', testResults);
        setResults(testResults);
        
      } catch (err) {
        console.error('❌ Database test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testDatabase();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: 'white' }}>
        <h2>🧪 Testing Database Connection...</h2>
        <p>Please wait while we check your database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'white' }}>
        <h2>❌ Database Test Failed</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <p>Check your browser console for more details.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Database Test Results</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>📊 Table Status:</h3>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
          <p><strong>Movies:</strong> {results.movies?.count || 0} rows {results.movies?.error && `(Error: ${results.movies.error})`}</p>
          <p><strong>Trailers:</strong> {results.trailers?.count || 0} rows {results.trailers?.error && `(Error: ${results.trailers.error})`}</p>
          <p><strong>Upcoming Movies:</strong> {results.upcoming_movies?.count || 0} rows {results.upcoming_movies?.error && `(Error: ${results.upcoming_movies.error})`}</p>
          <p><strong>New Releases:</strong> {results.new_releases?.count || 0} rows {results.new_releases?.error && `(Error: ${results.new_releases.error})`}</p>
        </div>
      </div>

      {results.movies?.data && results.movies.data.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>🎬 Sample Movies:</h3>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
            {results.movies.data.map((movie: any) => (
              <div key={movie.id} style={{ marginBottom: '0.5rem' }}>
                <strong>{movie.title}</strong> (ID: {movie.id}, Release: {movie.release_date})
              </div>
            ))}
          </div>
        </div>
      )}

      {results.movies?.dataError && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>❌ Movies Data Error:</h3>
          <p style={{ color: 'red' }}>{results.movies.dataError}</p>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        <h3>🔧 Next Steps:</h3>
        <ul>
          <li>If Movies count is 0: You need to import movie data</li>
          <li>If there are errors: Check your Supabase project settings</li>
          <li>If everything looks good: The issue might be in the Home.tsx component</li>
        </ul>
      </div>
    </div>
  );
}