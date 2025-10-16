// src/pages/EditInfo.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function EditInfo() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch user + profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setMessage('Failed to fetch user info');
        setLoading(false);
        return;
      }

      setEmail(user.email ?? '');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileData) {
        // Create profile if missing
        await supabase.from('profiles').insert({ id: user.id, username: user.email ?? '' });
        setUsername(user.email ?? '');
      } else {
        setUsername(profileData.username ?? '');
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setMessage('Failed to get user info');
      setLoading(false);
      return;
    }

    // Update username in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id);

    if (profileError) {
      setMessage('Failed to update username');
      setLoading(false);
      return;
    }

    // Update password if provided
    if (newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) {
        setMessage('Failed to update password: ' + passwordError.message);
        setLoading(false);
        return;
      }
    }

    setMessage('Profile updated successfully ✅');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center mb-4">Edit Profile</h1>

        <label className="flex flex-col gap-1">
          Username
          <input
            type="text"
            className="px-3 py-2 rounded-md bg-gray-700 text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          Email (readonly)
          <input
            type="email"
            className="px-3 py-2 rounded-md bg-gray-700 text-white cursor-not-allowed"
            value={email}
            readOnly
          />
        </label>

        <label className="flex flex-col gap-1">
          New Password
          <input
            type="password"
            className="px-3 py-2 rounded-md bg-gray-700 text-white"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md mt-2"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

        {message && <p className="text-center mt-2">{message}</p>}
      </div>
    </div>
  );
}
