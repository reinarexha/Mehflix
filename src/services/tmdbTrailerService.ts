// TMDb (The Movie Database) Trailer Service
// More reliable than YouTube search, has official trailers

import { supabase } from '../lib/supabaseClient';

// Get your free API key from https://www.themoviedb.org/settings/api
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

type TMDbMovie = {
  id: number;
  title: string;
  release_date: string;
  overview: string;
};

type TMDbVideo = {
  key: string; // YouTube video ID
  name: string;
  site: string; // "YouTube"
  type: string; // "Trailer", "Teaser", etc.
  official: boolean;
};

export class TMDbTrailerService {
  
  // Search for a movie on TMDb
  static async searchMovie(title: string, year?: string): Promise<TMDbMovie | null> {
    try {
      console.log('🔑 TMDb API Key:', TMDB_API_KEY ? 'Present' : 'Missing');
      console.log('🔍 Searching for:', title, year ? `(${year})` : '');
      
      const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        console.error('❌ TMDb API error:', response.status, response.statusText);
        throw new Error(`TMDb API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 TMDb search results:', data.results?.length || 0, 'movies found');
      
      if (!data.results || data.results.length === 0) {
        return null;
      }
      
      // If year is provided, try to find exact match
      if (year) {
        const exactMatch = data.results.find((movie: TMDbMovie) => 
          movie.release_date && movie.release_date.startsWith(year)
        );
        if (exactMatch) return exactMatch;
      }
      
      // Return first result
      return data.results[0];
      
    } catch (error) {
      console.error('Error searching TMDb:', error);
      return null;
    }
  }
  
  // Get videos (trailers) for a TMDb movie
  static async getMovieVideos(tmdbId: number): Promise<string | null> {
    try {
      const videosUrl = `${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}`;
      const response = await fetch(videosUrl);
      
      if (!response.ok) {
        throw new Error(`TMDb videos API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return null;
      }
      
      // Filter for YouTube trailers
      const youtubeTrailers = data.results.filter((video: TMDbVideo) => 
        video.site === 'YouTube' && 
        (video.type === 'Trailer' || video.type === 'Teaser')
      );
      
      if (youtubeTrailers.length === 0) {
        return null;
      }
      
      // Prefer official trailers
      const officialTrailer = youtubeTrailers.find((video: TMDbVideo) => video.official);
      const mainTrailer = youtubeTrailers.find((video: TMDbVideo) => video.type === 'Trailer');
      
      const bestTrailer = officialTrailer || mainTrailer || youtubeTrailers[0];
      return bestTrailer.key;
      
    } catch (error) {
      console.error('Error getting movie videos:', error);
      return null;
    }
  }
  
  // Complete workflow: search movie and get trailer
  static async getTrailerForMovie(title: string, year?: string): Promise<string | null> {
    const movie = await this.searchMovie(title, year);
    if (!movie) {
      console.log(`Movie not found on TMDb: ${title}`);
      return null;
    }
    
    const trailer = await this.getMovieVideos(movie.id);
    return trailer;
  }
  
  // Update movie trailer using TMDb
  static async updateMovieTrailer(movieId: number, tableName: string = 'movies'): Promise<boolean> {
    try {
      console.log('🎬 Starting update for movie ID:', movieId, 'in table:', tableName);
      
      // Get movie details from your database
      const { data: movie, error } = await supabase
        .from(tableName)
        .select('id, title, release_date')
        .eq('id', movieId)
        .single();
        
      if (error || !movie) {
        console.error('❌ Movie not found in database:', movieId, error);
        return false;
      }
      
      console.log('✅ Found movie in database:', movie.title, movie.release_date);
      
      // Extract year from release_date
      const year = movie.release_date ? new Date(movie.release_date).getFullYear().toString() : undefined;
      
      // Get trailer from TMDb
      const youtubeId = await this.getTrailerForMovie(movie.title, year);
      
      if (!youtubeId) {
        console.log(`No trailer found for: ${movie.title} (${year})`);
        return false;
      }
      
      // Update/insert trailer record
      const { error: upsertError } = await supabase
        .from('trailers')
        .upsert({
          id: movieId.toString(),
          title: movie.title,
          youtube_id: youtubeId,
          category: 'Movie',
          poster_url: '' // Can be enhanced with TMDb poster URLs
        });
        
      if (upsertError) {
        console.error('Error updating trailer:', upsertError);
        return false;
      }
      
      console.log(`✅ Updated trailer for "${movie.title}" (${year}): ${youtubeId}`);
      return true;
      
    } catch (error) {
      console.error('Error in updateMovieTrailer:', error);
      return false;
    }
  }
  
  // Batch update with TMDb (more reliable than YouTube)
  static async batchUpdateTrailers(
    movieIds: number[], 
    tableName: string = 'movies',
    delayMs: number = 250 // TMDb allows 40 requests per 10 seconds
  ) {
    console.log(`🎬 Starting TMDb batch update for ${movieIds.length} movies...`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < movieIds.length; i++) {
      const movieId = movieIds[i];
      
      console.log(`Processing ${i + 1}/${movieIds.length}: Movie ID ${movieId}`);
      
      const success = await this.updateMovieTrailer(movieId, tableName);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Respect TMDb rate limits
      if (i < movieIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`🏁 TMDb batch update complete! Success: ${successCount}, Failed: ${failureCount}`);
    return { successCount, failureCount };
  }
  
  // Update all movies using TMDb
  static async updateAllMovies(tableName: string = 'movies', limit: number = 100) {
    const { data: movies, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(limit);
      
    if (error || !movies) {
      console.error('Error fetching movies:', error);
      return;
    }
    
    const movieIds = movies.map((m: any) => m.id);
    return await this.batchUpdateTrailers(movieIds, tableName);
  }
}