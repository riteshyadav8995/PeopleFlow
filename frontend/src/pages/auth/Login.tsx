import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { LogIn } from 'lucide-react';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.data.user, data.data.tokens.accessToken, data.data.tokens.refreshToken);
      navigate('/');
    } catch (err: any) {
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="login-title">Sign in to your account</h2>
      
      {error && (
        <div className="badge badge-danger w-full justify-center mb-6 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
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
        
        <div className="login-form-group">
          <Input 
            className="login-input-override"
            label="Password" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="login-options">
          <label className="login-checkbox-label">
            <input type="checkbox" className="login-checkbox" />
            <span>Remember me</span>
          </label>
          <a href="#" className="login-forgot-link">
            Forgot password?
          </a>
        </div>

        <Button 
          type="submit" 
          className="login-submit-btn" 
          isLoading={loading}
          leftIcon={<LogIn size={20} />}
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}
