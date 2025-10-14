import { createClient } from "@supabase/supabase-js";

// 🔐 Put your real credentials here for dev (you can swap back to .env later)
const SUPABASE_URL = "https://dxykthrzmajqmzdphzjt.supabase.co";   // <-- change this
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eWt0aHJ6bWFqcW16ZHBoemp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTM5MDMsImV4cCI6MjA3NTQ4OTkwM30.qmVsQuq4NRiqiE2gKMdy4p2-MhKzbb2leby76YJ0HY0";             // <-- change this

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase credentials missing in supabaseClient.ts");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
