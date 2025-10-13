// src/pages/PersonalInfoPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface Props {
  userId: string;
}

export default function PersonalInfoPage({ userId }: Props) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error) setProfile(data);
    }
    fetchProfile();
  }, [userId]);

  if (!profile) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto bg-[#2E236C] rounded-md text-white shadow">
      <h2 className="text-xl font-semibold mb-4">Personal Info</h2>
      <p>
        <strong>Username:</strong> {profile.username}
      </p>
      <p>
        <strong>Email:</strong> {profile.email}
      </p>
      <p>
        <strong>Full Name:</strong> {profile.full_name || "Not set"}
      </p>
    </div>
  );
}
