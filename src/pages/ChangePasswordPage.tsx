// src/pages/ChangePasswordPage.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';

type Props = {
  userId: string;
};

export default function ChangePasswordPage({ userId: _userId }: Props) {
  const { user } = useUser();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState('');

  const email = user?.email ?? '';

  async function handleVerifyCurrent() {
    setVerifyError('');
    if (!email) return setVerifyError('No email available for current user');
    if (!currentPassword) return setVerifyError('Please enter your current password');
    setVerifying(true);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (res.error) {
        setVerifyError('Current password is incorrect');
        setVerified(false);
      } else {
        setVerified(true);
        setVerifyError('');
      }
    } catch (e) {
      setVerifyError('Verification failed');
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  }

  async function handleChangePassword() {
    setMessage('');
    if (!verified) return setMessage('Please verify current password first');
    if (!newPassword) return setMessage('New password cannot be empty');
    if (newPassword !== confirmPassword) return setMessage('Passwords do not match');
    setChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setMessage('Error changing password: ' + error.message);
      } else {
        setMessage('Password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
        // Redirect back to profile after short delay
        setTimeout(() => navigate('/profile'), 1000);
      }
    } catch (e) {
      setMessage('Failed to change password');
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Change Password</h2>

        {message && <div className={`mb-4 ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</div>}

        {!verified ? (
          <>
            <p className="text-sm text-gray-400 mb-2">Enter your current password to continue</p>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
            />
            {verifyError && <div className="text-red-400 mb-2">{verifyError}</div>}
            <div className="flex gap-2">
              <button
                onClick={handleVerifyCurrent}
                disabled={verifying}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                {verifying ? 'Checking...' : 'Verify'}
              </button>
              <button className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded" onClick={() => navigate('/profile')}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-2">Enter your new password below</p>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <div className="text-red-400 mb-2">Passwords do not match</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                disabled={changing || newPassword.length === 0 || newPassword !== confirmPassword}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
              >
                {changing ? 'Changing...' : 'Change Password'}
              </button>
              <button className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded" onClick={() => navigate('/profile')}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
