
import { useState, useEffect } from "react";
import { Link } from 'react-router-dom'
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";

type MessageType = {
  text: string;
  type: "success" | "error";
};

export default function EditInfoPage() {
  const { user: currentUser, loading: userLoading } = useUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageType>({ text: "", type: "success" });

  // Debug: Log user state
  useEffect(() => {
    console.log('EditInfoPage - User state:', { currentUser, userLoading });
    console.log('EditInfoPage - Current user object:', currentUser);
    console.log('EditInfoPage - User loading state:', userLoading);
    console.log('EditInfoPage - Type of currentUser:', typeof currentUser);
    console.log('EditInfoPage - Is currentUser truthy?', !!currentUser);
  }, [currentUser, userLoading]);

  // Load initial profile data
  useEffect(() => {
    async function loadProfile() {
      // Don't set error message if still loading
      if (userLoading) {
        return;
      }
      
      if (!currentUser) {
        setMessage({ text: "Please sign in to edit your profile", type: "error" });
        return;
      }

      // Clear any previous error messages when user is authenticated
      setMessage({ text: "", type: "success" });

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
  }, [currentUser, userLoading]);


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

        {userLoading ? (
          <div className="text-center">
            <p className="text-gray-400">Loading user data...</p>
          </div>
        ) : currentUser ? (
          <>
            <div className="text-sm text-gray-400 mb-4">
              Signed in as: {currentUser.email}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Link to="/change-password" className="text-sm text-blue-400 hover:underline">Change password</Link>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-2 rounded-md mt-2 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-red-400 mb-4">Please sign in to edit your profile</p>
            <a 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md inline-block text-white no-underline"
            >
              Go to Login
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
