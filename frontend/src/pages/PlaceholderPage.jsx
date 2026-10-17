import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Layers, ShieldCheck } from 'lucide-react';

export default function PlaceholderPage({ title, description }) {
  return (
    <DashboardLayout>
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card-rounded" style={{
          padding: '4rem 2rem',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '2rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}>
          <div style={{
            background: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            padding: '1.25rem',
            borderRadius: '1.5rem',
            display: 'flex'
          }}>
            <Layers size={48} />
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0F172A' }}>
            {title}
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#64748B', maxWidth: '500px', lineHeight: '1.6' }}>
            {description || 'Comprehensive data and record management for this module.'}
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#E0E7FF',
            color: '#3730A3',
            padding: '0.5rem 1.25rem',
            borderRadius: '99px',
            fontSize: '0.9rem',
            fontWeight: '700',
            marginTop: '1rem'
          }}>
            <ShieldCheck size={18} />
            <span>PackFlow Enterprise Module</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
