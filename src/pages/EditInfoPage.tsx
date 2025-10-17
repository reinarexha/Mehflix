import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";

type MessageType = {
  text: string;
  type: "success" | "error";
};

export default function EditInfoPage() {
  const { user: currentUser } = useUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageType>({ text: "", type: "success" });

  // Load initial profile data
  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) {
        setMessage({ text: "Please sign in to edit your profile", type: "error" });
        return;
      }

      setLoading(true);
      try {
        setEmail(currentUser.email ?? "");

        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", currentUser.id)
          .single();

        if (error) {
          console.log("Profile not found, will create on save");
          setUsername("");
        } else {
          setUsername(data.username ?? "");
        }
      } catch (err) {
        setMessage({ text: err instanceof Error ? err.message : "Failed to load profile", type: "error" });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [currentUser]);

  // Handle username updates
  const updateUsername = async () => {
    if (!currentUser) {
      setMessage({ text: "Please sign in", type: "error" });
      return;
    }

    if (!username.trim()) {
      setMessage({ text: "Username cannot be empty", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const { error, count } = await supabase
        .from("profiles")
        .update({ username, updated_at: new Date().toISOString() })
        .eq("id", currentUser.id);

      if (error) throw error;

      if (count === 0) {
        // No row existed, create it
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: currentUser.id, username });

        if (insertError) throw insertError;

        setMessage({ text: "Profile created and username updated!", type: "success" });
      } else {
        setMessage({ text: "Username updated successfully!", type: "success" });
      }

      // Update auth metadata and trigger refresh
      await supabase.auth.updateUser({ data: { username } });
      await supabase.auth.getUser();
      window.dispatchEvent(new CustomEvent("auth:refreshed"));
      window.dispatchEvent(new CustomEvent("profile:updated", { detail: { username } }));
    } catch (error) {
      setMessage({ 
        text: error instanceof Error ? error.message : "Failed to update username",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update email
  const updateEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ text: "Email update initiated! Check your inbox to confirm.", type: "success" });
    }
    setLoading(false);
  };

  // Update password
  const updatePassword = async () => {
    setLoading(true);
    if (!newPassword) {
      setMessage({ text: "Password cannot be empty", type: "error" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ text: "Password updated successfully!", type: "success" });
    }

    setNewPassword("");
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow bg-gray-800 text-white">
      <h2 className="text-2xl font-bold mb-4">Edit Info</h2>

      {message.text && (
        <p className={`mb-4 ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>
          {message.text}
        </p>
      )}

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
