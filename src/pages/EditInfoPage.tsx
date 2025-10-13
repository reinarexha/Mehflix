// src/pages/EditInfoPage.tsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface Props {
  userId: string;
}

export default function EditInfoPage({ userId }: Props) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) return;
      setUsername(data.username);
    }
    fetchProfile();
  }, [userId]);

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", userId);
    setLoading(false);
    if (error) alert(error.message);
    else alert("Profile updated!");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Edit Info</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-[#1c1530] text-white border border-white/10"
      />
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="px-4 py-2 bg-button text-[#1c1530] font-semibold rounded hover:bg-white/80 transition"
      >
        {loading ? "Updating..." : "Update Info"}
      </button>
    </div>
  );
}
