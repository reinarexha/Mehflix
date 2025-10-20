import { createClient } from "@supabase/supabase-js";

// 🔐 Use environment variables or fallback to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dxykthrzmajqmzdphzjt.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eWt0aHJ6bWFqcW16ZHBoemp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTM5MDMsImV4cCI6MjA3NTQ4OTkwM30.qmVsQuq4NRiqiE2gKMdy4p2-MhKzbb2leby76YJ0HY0";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase credentials missing in supabaseClient.ts");
}

console.log('🔧 Supabase URL:', SUPABASE_URL);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test connection on import
console.log('🔗 Testing Supabase connection...');
supabase.from('profiles').select('count', { count: 'exact', head: true })
  .then(({ error, count }) => {
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connected successfully. Profiles count:', count);
    }
  });
