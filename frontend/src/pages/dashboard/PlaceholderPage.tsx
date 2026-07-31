import React from 'react';

export function PlaceholderPage({ title, description }: { title: string, description?: string }) {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b', textAlign: 'center' }}>
      <img src="https://illustrations.popsy.co/blue/freelancer.svg" alt="Coming soon" style={{ height: '200px', marginBottom: '2rem', opacity: 0.8 }} />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{ maxWidth: '400px' }}>{description || 'This module is currently under development. Check back soon for updates!'}</p>
    </div>
  );
}
