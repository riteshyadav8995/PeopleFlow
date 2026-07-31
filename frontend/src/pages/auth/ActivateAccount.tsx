import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { KeyRound, CheckCircle } from 'lucide-react';

export function ActivateAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError('Activation token is missing from the URL.');
    }
  }, [location]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing activation token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/activate', { token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to activate account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <CheckCircle size={48} color="#34d399" />
        <h2 className="text-xl font-bold">Account Activated!</h2>
        <p className="text-secondary">
          Your account has been successfully set up. Redirecting you to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleActivate} className="auth-form space-y-6 p-2">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2">Create Password</h2>
        <p className="text-sm text-secondary">
          Set up a strong password to activate your PeopleFlow account.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4 text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full mt-6"
        disabled={loading || !token}
      >
        {loading ? 'Activating...' : 'Activate Account'}
      </Button>
    </form>
  );
}
