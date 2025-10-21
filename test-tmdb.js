// Quick test to debug the TMDb API integration
import { TMDbTrailerService } from './src/services/tmdbTrailerService.js';

// Test the API key and basic functionality
async function testTMDbAPI() {
  console.log('🧪 Testing TMDb API...');
  
  // Test 1: Search for a well-known movie
  try {
    const movie = await TMDbTrailerService.searchMovie("Avengers: Endgame", "2019");
    console.log('✅ Movie search result:', movie);
    
    if (movie) {
      const trailer = await TMDbTrailerService.getMovieVideos(movie.id);
      console.log('✅ Trailer result:', trailer);
    }
  } catch (error) {
    console.error('❌ TMDb API test failed:', error);
  }
}

// Run the test
testTMDbAPI();