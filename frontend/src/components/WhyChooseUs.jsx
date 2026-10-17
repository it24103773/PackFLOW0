import React from 'react';
import { Zap, PackageCheck, Layers3, ShieldCheck, CheckCircle, BarChart3 } from 'lucide-react';

export default function WhyChooseUs() {
  const features = [
    {
      title: 'Fast Workflow',
      description: 'Streamline job ticketing, pre-press checks, and automated order routing to drastically reduce turnaround times.',
      icon: Zap,
      accent: '#F59E0B',
      bgColor: '#FEF3C7'
    },
    {
      title: 'Inventory Tracking',
      description: 'Real-time visibility into raw substrate stock, ink levels, finished packaging inventory, and reorder alerts.',
      icon: PackageCheck,
      accent: '#0F4C81',
      bgColor: '#EBF4FC'
    },
    {
      title: 'Packaging Management',
      description: 'Centralized control for die-line specs, print job parameters, coating options, and client customization requirements.',
      icon: Layers3,
      accent: '#10B981',
      bgColor: '#D1FAE5'
    },
    {
      title: 'Secure System',
      description: 'Enterprise-grade access control, reliable data encryption, audit trails, and role-based client permission security.',
      icon: ShieldCheck,
      accent: '#6366F1',
      bgColor: '#EEF2FF'
    }
  ];

  return (
    <section style={{
      padding: '6rem 1.5rem',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      borderBottom: '1px solid #E2E8F0'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 4rem auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#EBF4FC',
            color: '#0F4C81',
            padding: '0.35rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            <span>Why Industry Leaders Trust Us</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem' }}>
            Why Choose PackFlow
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748B', lineHeight: '1.6' }}>
            Purpose-built digital platform engineered specifically for modern packaging and printing plant operations.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem'
        }}>
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="card-rounded"
                style={{
                  padding: '2.25rem 1.75rem',
                  background: '#FFFFFF',
                  borderRadius: '1.5rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '1rem',
                  backgroundColor: feature.bgColor,
                  color: feature.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${feature.accent}20`
                }}>
                  <Icon size={28} strokeWidth={2.2} />
                </div>

                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.6rem' }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '0.925rem', color: '#64748B', lineHeight: '1.6' }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
