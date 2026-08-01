import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Lock } from 'lucide-react';
import './Login.css';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: any) {
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="login-title mb-4">Invalid Link</h2>
        <p className="text-gray-500 mb-6">The password reset link is invalid or has expired.</p>
        <Button onClick={() => navigate('/login')} className="w-full">
          Return to sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="login-title">Create new password</h2>
      <p className="text-gray-500 text-sm mb-6 text-center">
        Please enter your new password below.
      </p>
      
      {error && (
        <div className="badge badge-danger w-full justify-center mb-6 py-3">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center space-y-4">
          <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm border border-green-200">
            Your password has been successfully reset.
          </div>
          <Button 
            className="w-full mt-4" 
            onClick={() => navigate('/login')}
          >
            Sign in with new password
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <Input 
              className="login-input-override"
              label="New Password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="login-form-group">
            <Input 
              className="login-input-override"
              label="Confirm New Password" 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="login-submit-btn w-full mt-6" 
            isLoading={loading}
            leftIcon={<Lock size={20} />}
          >
            Reset password
          </Button>
        </form>
      )}
    </div>
  );
}
