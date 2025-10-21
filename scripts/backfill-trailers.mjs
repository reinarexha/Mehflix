// Backfill YouTube trailer IDs into movies tables and upsert into trailers table
// Requirements:
// - Set env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY, YOUTUBE_API_KEY
// - Run: npm run backfill:trailers

import { createClient } from "@supabase/supabase-js";

// Defaults aligned with src/lib/supabaseClient.ts for convenience
const DEFAULT_SUPABASE_URL = "https://dxykthrzmajqmzdphzjt.supabase.co";
const DEFAULT_SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eWt0aHJ6bWFqcW16ZHBoemp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTM5MDMsImV4cCI6MjA3NTQ4OTkwM30.qmVsQuq4NRiqiE2gKMdy4p2-MhKzbb2leby76YJ0HY0";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE key env vars.");
  process.exit(1);
}

if (!YOUTUBE_API_KEY) {
  console.error("Missing YOUTUBE_API_KEY. Set YOUTUBE_API_KEY env var.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLES = ["movies", "upcoming_movies", "new_releases"];

async function searchYouTubeTrailer(title, year) {
  const q = [title, "official trailer", year ? String(year) : ""].filter(Boolean).join(" ");
  const params = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: "snippet",
    type: "video",
    maxResults: "1",
    q,
    safeSearch: "moderate",
  });
  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube API error ${res.status}`);
  }
  const data = await res.json();
  const item = data.items && data.items[0];
  const videoId = item && item.id && item.id.videoId;
  return videoId || null;
}

function getYear(releaseDate) {
  if (!releaseDate) return null;
  try {
    const d = new Date(releaseDate);
    const y = d.getFullYear();
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

async function fetchNeedingBackfill(table, from = 0, to = 199) {
  // youtube_id null or empty
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .or("youtube_id.is.null,youtube_id.eq.")
    .range(from, to);
  if (error) throw error;
  return data || [];
}

async function updateRowWithYoutubeId(table, id, youtubeId) {
  const { error } = await supabase
    .from(table)
    .update({ youtube_id: youtubeId })
    .eq("id", id);
  if (error) throw error;
}

async function upsertTrailerFromRow(row, youtubeId) {
  const payload = {
    id: String(row.id),
    title: row.title || "Unknown Movie",
    youtube_id: youtubeId,
    category: row.genre || row.category || "Unknown",
    poster_url: row.poster_url || "",
  };
  const { error } = await supabase.from("trailers").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

async function backfillTable(table) {
  console.log(`\n=== Backfilling table: ${table} ===`);
  let processed = 0;
  let updated = 0;
  let from = 0;
  const pageSize = 200;
  while (true) {
    const rows = await fetchNeedingBackfill(table, from, from + pageSize - 1);
    if (!rows.length) break;
    for (const row of rows) {
      processed += 1;
      const title = row.title || row.name || String(row.id);
      const year = getYear(row.release_date);
      try {
        const videoId = await searchYouTubeTrailer(title, year);
        if (videoId) {
          await updateRowWithYoutubeId(table, row.id, videoId);
          try {
            await upsertTrailerFromRow(row, videoId);
          } catch (e) {
            console.warn(`Upsert into trailers failed for ${row.id}:`, e.message || e);
          }
          updated += 1;
          console.log(`✅ ${table} id=${row.id} ← ${videoId} (${title})`);
        } else {
          console.log(`⚠️  No trailer found for ${table} id=${row.id} (${title})`);
        }
      } catch (e) {
        console.warn(`❌ Search/update failed for ${table} id=${row.id}:`, e.message || e);
      }
    }
    from += pageSize;
  }
  console.log(`Done ${table}: processed=${processed}, updated=${updated}`);
}

async function main() {
  const usingServiceRole = Boolean(SUPABASE_SERVICE_ROLE_KEY);
  if (!usingServiceRole) {
    console.warn("Warning: Using anon key. Updates may fail if RLS blocks access. Prefer SUPABASE_SERVICE_ROLE_KEY.");
  }
  for (const table of TABLES) {
    await backfillTable(table);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


