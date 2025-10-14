// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// 🔐 OPTION 1 — Hardcode your credentials here
// (use only for local testing / development)
const SUPABASE_URL = "https://dxykthrzmajqmzdphzjt.supabase.co"; // <--- replace this
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eWt0aHJ6bWFqcW16ZHBoemp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTM5MDMsImV4cCI6MjA3NTQ4OTkwM30.qmVsQuq4NRiqiE2gKMdy4p2-MhKzbb2leby76YJ0HY0"; // <--- replace this

// 🧠 OPTION 2 — fallback to .env if you later add it
const supabaseUrl = SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🛠️ Sanity check
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase credentials are missing! Please add them above.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
