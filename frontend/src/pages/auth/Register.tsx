import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Building2 } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    tenantName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register', formData);
      alert(`Organization created successfully! You can now log in using ${formData.email}`);
      setFormData({
        tenantName: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: ''
      });
      navigate('/');
    } catch (err: any) {
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError('Backend unavailable.');
      } else {
        setError(err.response?.data?.message || 'Failed to create organization');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create Organization</h2>
      
      {error && (
        <div className="badge badge-danger w-full justify-center" style={{ marginBottom: '1rem', padding: '0.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRegister}>
        <Input 
          id="tenantName"
          label="Company Name" 
          placeholder="Acme Corp"
          value={formData.tenantName}
          onChange={handleChange}
          required
        />

        <div className="flex gap-4">
          <Input 
            id="firstName"
            label="First Name" 
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full"
          />
          <Input 
            id="lastName"
            label="Last Name" 
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>

        <Input 
          id="email"
          label="Work Email" 
          type="email" 
          placeholder="john@acme.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
        
        <Input 
          id="password"
          label="Password" 
          type="password" 
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Button 
          type="submit" 
          className="w-full justify-center" 
          style={{ marginTop: '1rem' }}
          isLoading={loading}
          leftIcon={<Building2 size={18} />}
        >
          Create Account
        </Button>
      </form>

    </div>
  );
}
