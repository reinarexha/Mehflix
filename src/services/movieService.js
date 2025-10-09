import { supabase } from "../lib/supabaseClient";

// CREATE
export async function addMovie(movie) {
  const { data, error } = await supabase.from("movies").insert([movie]);
  if (error) throw error;
  return data;
}

// READ
export async function getMovies() {
  const { data, error } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// UPDATE
export async function updateMovie(id, updates) {
  const { data, error } = await supabase.from("movies").update(updates).eq("id", id);
  if (error) throw error;
  return data;
}

// DELETE
export async function deleteMovie(id) {
  const { error } = await supabase.from("movies").delete().eq("id", id);
  if (error) throw error;
}
