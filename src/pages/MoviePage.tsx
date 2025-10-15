import Movie from "../components/Movie";
import { useMovie } from "../hooks/useMovie";

export default function MoviePage() {
  const movieId = 1; // change to the id of a movie in your Supabase table
  const userId = "123"; // replace with actual logged-in user ID

  const { movie, loading } = useMovie(movieId);

  if (loading) return <p>Loading movie from database...</p>;
  if (!movie) return <p>Movie not found!</p>;

  return <Movie movie={movie} userId={userId} />;
}
