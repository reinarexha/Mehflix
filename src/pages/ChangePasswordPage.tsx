// src/pages/ChangePasswordPage.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Props = {
  userId: string;
};

export default function ChangePasswordPage({ userId }: Props) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleChangePassword() {
    if (!userId) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage('Error changing password: ' + error.message);
    } else {
      setMessage('Password changed successfully!');
      setPassword('');
    }
    setLoading(false);
  }

  return (
    <div>
      <h2>Change Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleChangePassword} disabled={loading}>
        {loading ? 'Changing...' : 'Change Password'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
