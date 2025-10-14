// src/pages/RatingsPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface Props {
  userId: string;
}

export default function RatingsPage({ userId }: Props) {
  const [ratings, setRatings] = useState<any[]>([]);

  useEffect(() => {
    async function loadRatings() {
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.warn('Failed to load ratings:', error.message);
        setRatings([]);
        return;
      }

      setRatings(data || []);
    }

    loadRatings();
  }, [userId]);

  if (!ratings.length) return <p className="p-4">No ratings yet.</p>;

  return (
    <div className="p-4 grid gap-4">
      {ratings.map((r) => (
        <div
          key={r.id}
          className="p-4 bg-[#2E236C] text-white rounded-md shadow"
        >
          <p>
            Movie ID: {r.movie_id} - Rating: {r.rating}/10
          </p>
          {r.comment && <p className="text-gray-300 mt-1">"{r.comment}"</p>}
        </div>
      ))}
    </div>
  );
}
