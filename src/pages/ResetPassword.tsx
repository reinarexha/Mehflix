// src/pages/ResetPassword.tsx
import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("access_token"); // Supabase token
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!token) return <Navigate to="/login" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.updateUser({
      password,
      email: undefined,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) return <Navigate to="/login" replace />;

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <h2>Reset Password</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />
        <button type="submit" style={{ width: "100%", padding: "0.5rem" }}>
          Set New Password
        </button>
      </form>
    </div>
  );
}
