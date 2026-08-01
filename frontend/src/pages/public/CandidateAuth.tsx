import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { PUBLIC_API_URL } from '@/lib/api';

export default function CandidateAuth() {
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (authMode === 'LOGIN') {
      try {
        const res = await axios.post(`${PUBLIC_API_URL}/auth/login`, { email, password });
        localStorage.setItem('candidateToken', res.data.token);
        
        const redirectUrl = searchParams.get('redirect') || '/jobs';
        window.location.href = redirectUrl;
      } catch (error: any) {
        alert(error.response?.data?.message || 'Login failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      await axios.post(`${PUBLIC_API_URL}/auth/send-otp`, { email, firstName, lastName });
      setStep('OTP');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${PUBLIC_API_URL}/auth/verify-otp`, { email, otp, firstName, lastName, password });
      localStorage.setItem('candidateToken', res.data.token);
      
      const redirectUrl = searchParams.get('redirect') || '/jobs';
      window.location.href = redirectUrl;
    } catch (error: any) {
      alert(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', width: '100%', maxWidth: '450px', padding: '3rem 2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        
        {step === 'EMAIL' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ background: '#eef2ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Mail size={32} color="#4f46e5" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{authMode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}</h1>
              <p style={{ color: '#64748b' }}>{authMode === 'LOGIN' ? 'Enter your email to sign in.' : 'Enter your details to create an account.'}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: '#f1f5f9', padding: '0.375rem', borderRadius: '0.5rem' }}>
              <button onClick={() => setAuthMode('LOGIN')} type="button" style={{ flex: 1, padding: '0.5rem', border: 'none', background: authMode === 'LOGIN' ? '#fff' : 'transparent', color: authMode === 'LOGIN' ? '#0f172a' : '#64748b', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', boxShadow: authMode === 'LOGIN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Login</button>
              <button onClick={() => setAuthMode('SIGNUP')} type="button" style={{ flex: 1, padding: '0.5rem', border: 'none', background: authMode === 'SIGNUP' ? '#fff' : 'transparent', color: authMode === 'SIGNUP' ? '#0f172a' : '#64748b', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', boxShadow: authMode === 'SIGNUP' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Sign Up</button>
            </div>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {authMode === 'SIGNUP' && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>First Name</label>
                    <input 
                      type="text" 
                      placeholder="John"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>Last Name</label>
                    <input 
                      type="text" 
                      placeholder="Doe"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none' }} 
                    />
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>Email Address *</label>
                <input 
                  type="email" 
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>Password *</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none' }} 
                />
              </div>

              <button disabled={loading} type="submit" style={{ width: '100%', padding: '0.875rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                {loading ? 'Processing...' : authMode === 'LOGIN' ? 'Log In' : 'Continue'} {authMode === 'LOGIN' ? '' : <ArrowRight size={18} />}
              </button>
            </form>
          </>
        ) : (
          <>
             <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ background: '#ecfdf5', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <ShieldCheck size={32} color="#059669" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Verify Email</h1>
              <p style={{ color: '#64748b' }}>We sent a 6-digit code to <strong>{email}</strong>.</p>
            </div>

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>Verification Code</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', outline: 'none', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5rem', fontWeight: 700, color: '#1e293b' }} 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || otp.length < 6}
                style={{ marginTop: '0.5rem', width: '100%', padding: '0.875rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'} <CheckCircle2 size={18} />
              </button>
            </form>
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button onClick={() => setStep('EMAIL')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}>Incorrect email? Go back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
