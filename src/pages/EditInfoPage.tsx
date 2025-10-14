// src/pages/EditInfo.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  userId?: string
}

export default function EditInfo(_props: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch current user and profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setMessage("Failed to fetch user info");
        setLoading(false);
        return;
      }

      setEmail(user.email);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.log("Profile row not found. It will be created on update.");
        setUsername(""); // Empty if profile missing
      } else {
        setUsername(profileData.username);
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  // Update or create username
  const updateUsername = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("User not logged in");
      setLoading(false);
      return;
    }

    // Try updating first
    const { error, count } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
    } else if (count === 0) {
      // No row existed, create it
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id, username });

      if (insertError) setMessage(insertError.message);
      else setMessage("Profile row created and username updated!");
      // Notify other parts of the app that profile changed
      // Also persist username into the auth user metadata so other code can read it
      try {
        await supabase.auth.updateUser({ data: { username } })
      } catch (e) {
        console.warn('Failed to update auth user metadata', e)
      }
      // Refresh auth user data for other parts of the app
      try {
        await supabase.auth.getUser()
        window.dispatchEvent(new CustomEvent('auth:refreshed'))
      } catch (e) {
        console.warn('Failed to refresh auth user after update', e)
      }
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { username } }))
    } else {
      setMessage("Username updated successfully!");
      try {
        await supabase.auth.updateUser({ data: { username } })
        await supabase.auth.getUser()
        window.dispatchEvent(new CustomEvent('auth:refreshed'))
      } catch (e) {
        console.warn('Failed to update auth user metadata', e)
      }
      // Notify other parts of the app that profile changed
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { username } }))
    }

    setLoading(false);
  };

  // Update email
  const updateEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email });

    if (error) setMessage(error.message);
    else setMessage("Email updated! Check your inbox to confirm.");
    setLoading(false);
  };

  // Update password
  const updatePassword = async () => {
    setLoading(true);
    if (!newPassword) {
      setMessage("Password cannot be empty");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) setMessage(error.message);
    else setMessage("Password updated successfully!");

    setNewPassword("");
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow bg-gray-800 text-white">
      <h2 className="text-2xl font-bold mb-4">Edit Info</h2>

      {message && <p className="mb-4 text-green-400">{message}</p>}

      <div className="mb-4">
        <label className="block mb-1 font-medium">Username</label>
        <input
          type="text"
          className="w-full p-2 border rounded bg-gray-900 text-white"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          onClick={updateUsername}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          disabled={loading}
        >
          Update Username
        </button>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Email</label>
        <input
          type="email"
          className="w-full p-2 border rounded bg-gray-900 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={updateEmail}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          disabled={loading}
        >
          Update Email
        </button>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">New Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded bg-gray-900 text-white"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button
          onClick={updatePassword}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          disabled={loading}
        >
          Update Password
        </button>
      </div>
    </div>
  );
}
