import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Mail, ArrowLeft } from 'lucide-react';
import './Login.css';

export function ForgotPassword() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to send reset link');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <ArrowLeft size={16} /> Back to login
        </Link>
      </div>
      
      <h2 className="login-title">Reset your password</h2>
      <p className="text-gray-500 text-sm mb-6 text-center">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      {error && (
        <div className="badge badge-danger w-full justify-center mb-6 py-3">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center space-y-4">
          <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm border border-green-200">
            If an account exists for <b>{email}</b>, we have sent a password reset link. Please check your email.
          </div>
          <Button 
            className="w-full mt-4" 
            onClick={() => navigate('/login')}
          >
            Return to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <Input 
              className="login-input-override"
              label="Email Address" 
              type="email" 
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="login-submit-btn w-full mt-6" 
            isLoading={loading}
            leftIcon={<Mail size={20} />}
          >
            Send reset link
          </Button>
        </form>
      )}
    </div>
  );
}
