// tmdbTrailerFetcher.js
import fetch from "node-fetch";

/**
 * Fetches and returns the official trailer for a movie from TMDb.
 * @param {Object} movie - Movie object from your DB
 * @param {string} movie.title - Movie title
 * @param {string} movie.release_date - Release date (YYYY-MM-DD)
 * @param {string} TMDB_API_KEY - Your TMDb API key
 */
export async function getOfficialTrailer(movie, TMDB_API_KEY) {
  try {
    const year = movie.release_date?.split("-")[0];
    const query = encodeURIComponent(movie.title);

    // 1️⃣ Search movie on TMDb
    const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${query}&year=${year}&api_key=${TMDB_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results?.length) {
      console.log(`❌ No TMDb results found for "${movie.title}"`);
      return null;
    }

    const tmdbMovie = searchData.results[0];

    // 2️⃣ Get trailer videos for the movie
    const videosUrl = `https://api.themoviedb.org/3/movie/${tmdbMovie.id}/videos?api_key=${TMDB_API_KEY}`;
    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();

    // Filter for official YouTube trailers
    const trailer = videosData.results.find(
      (v) =>
        v.site === "YouTube" &&
        v.type === "Trailer" &&
        (v.official || v.name.toLowerCase().includes("official"))
    );

    if (!trailer) {
      console.log(`⚠️ No official trailer found for "${movie.title}"`);
      return null;
    }

    // 3️⃣ Construct the trailer data object
    const trailerData = {
      id: movie.id,
      title: movie.title,
      youtube_id: trailer.key,
      category: "Movie",
      poster_url: `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`,
    };

    console.log("✅ Found trailer:", trailerData);
    return trailerData;
  } catch (err) {
    console.error("❌ Error fetching trailer:", err.message);
    return null;
  }
}

// Example usage
// (You can replace this with DB logic later)
const movie = {
  id: 123,
  title: "Avengers: Endgame",
  release_date: "2019-04-26",
};

const TMDB_API_KEY = "cf476409970e8f734169b34ee3f02958"; // 🔑 Replace with your TMDb API key

getOfficialTrailer(movie, TMDB_API_KEY);
