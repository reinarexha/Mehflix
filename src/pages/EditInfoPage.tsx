
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

    // Update password if provided
    if (newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) {
        setMessage({ text: 'Failed to update password: ' + passwordError.message, type: 'error' });
        setLoading(false);
        return;
      }
    }

    setMessage({ text: "Password updated successfully!", type: "success" });

    setNewPassword("");

    setLoading(false);
  };

  // Save all changes (uses individual update helpers)
  const handleSave = async () => {
    if (!currentUser) {
      setMessage({ text: "Please sign in to save changes", type: "error" });
      return;
    }
    if (username !== undefined) {
      await updateUsername();
    }
    if (email && email !== (currentUser.email ?? "")) {
      await updateEmail();
    }
    if (newPassword) {
      await updatePassword();
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center mb-4">Edit Profile</h1>

      {message.text && (
        <p className={`mb-4 ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>
          {message.text}
        </p>
      )}


        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md mt-2"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

      </div>
    </div>
  );
}
