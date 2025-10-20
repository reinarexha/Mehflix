// YouTube Trailer Service
// This service fetches real YouTube trailers for your movies

import { supabase } from '../lib/supabaseClient';

// You'll need to get a YouTube Data API key from Google Cloud Console
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

type YouTubeSearchResult = {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: any;
  };
};

export class YouTubeTrailerService {
  
  // Search for a movie trailer on YouTube
  static async searchTrailer(movieTitle: string, year?: string): Promise<string | null> {
    try {
      const searchQuery = year 
        ? `${movieTitle} ${year} official trailer`
        : `${movieTitle} official trailer`;
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `type=video&` +
        `videoDefinition=high&` +
        `videoDuration=short&` +
        `maxResults=5&` +
        `key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter results to find the best trailer
      const trailerKeywords = ['trailer', 'teaser', 'preview', 'official'];
      const bestResult = data.items?.find((item: YouTubeSearchResult) => 
        trailerKeywords.some(keyword => 
          item.snippet.title.toLowerCase().includes(keyword)
        )
      );
      
      return bestResult?.id?.videoId || data.items?.[0]?.id?.videoId || null;
      
    } catch (error) {
      console.error('Error searching YouTube trailer:', error);
      return null;
    }
  }
  
  // Update a movie's trailer in the database
  static async updateMovieTrailer(movieId: number, tableName: string = 'movies') {
    try {
      // Get movie details
      const { data: movie, error } = await supabase
        .from(tableName)
        .select('id, title, release_date')
        .eq('id', movieId)
        .single();
        
      if (error || !movie) {
        console.error('Movie not found:', movieId);
        return false;
      }
      
      // Extract year from release_date
      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : undefined;
      
      // Search for trailer
      const youtubeId = await this.searchTrailer(movie.title, year?.toString());
      
      if (!youtubeId) {
        console.log('No trailer found for:', movie.title);
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
          poster_url: '' // You can add poster logic here too
        });
        
      if (upsertError) {
        console.error('Error updating trailer:', upsertError);
        return false;
      }
      
      console.log(`✅ Updated trailer for "${movie.title}": ${youtubeId}`);
      return true;
      
    } catch (error) {
      console.error('Error updating movie trailer:', error);
      return false;
    }
  }
  
  // Batch update trailers for multiple movies
  static async batchUpdateTrailers(
    movieIds: number[], 
    tableName: string = 'movies',
    delayMs: number = 1000 // Delay between API calls to respect rate limits
  ) {
    console.log(`🎬 Starting batch update for ${movieIds.length} movies...`);
    
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
      
      // Add delay to respect YouTube API rate limits (1000 requests per day)
      if (i < movieIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`🏁 Batch update complete! Success: ${successCount}, Failed: ${failureCount}`);
    return { successCount, failureCount };
  }
  
  // Update all movies in a table (use with caution!)
  static async updateAllMovies(tableName: string = 'movies', limit: number = 100) {
    console.log(`⚠️ WARNING: This will update ALL movies in ${tableName} table!`);
    
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

// Example usage:
export const updateSingleMovieTrailer = async (movieId: number) => {
  return await YouTubeTrailerService.updateMovieTrailer(movieId);
};

export const updateMoviesBatch = async (movieIds: number[]) => {
  return await YouTubeTrailerService.batchUpdateTrailers(movieIds);
};

export const updateFirst100Movies = async () => {
  return await YouTubeTrailerService.updateAllMovies('movies', 100);
};