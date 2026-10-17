import React from 'react';
import { Package, Users, Truck, Database, Factory, Award } from 'lucide-react';

export default function About() {
  const highlights = [
    { title: 'Product Specification', icon: Package, text: 'Custom packaging specs & die-line dimensions' },
    { title: 'Order Lifecycle', icon: Factory, text: 'From client job request to dispatch' },
    { title: 'Inventory & Stock', icon: Database, text: 'Raw material & finished box tracking' },
    { title: 'Supplier & Client CRM', icon: Users, text: 'Integrated vendor & customer portal' }
  ];

  return (
    <section id="about" style={{
      padding: '6rem 1.5rem',
      backgroundColor: '#F8FAFC',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '4rem',
        alignItems: 'center'
      }}>
        {/* Left Side Visual Cards Stack */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="card-rounded"
                style={{
                  padding: '1.75rem 1.25rem',
                  background: '#FFFFFF',
                  borderRadius: '1.25rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '0.85rem',
                  background: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={22} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A' }}>{item.title}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5' }}>{item.text}</p>
              </div>
            );
          })}
        </div>

        {/* Right Side Text Content */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            padding: '0.35rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            <span>About PackFlow</span>
          </div>

          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#0F172A',
            lineHeight: '1.2',
            marginBottom: '1.25rem'
          }}>
            Transforming Packaging Management into a Seamless Digital Experience
          </h2>

          <p style={{
            fontSize: '1.05rem',
            color: '#475569',
            lineHeight: '1.7',
            marginBottom: '1.5rem'
          }}>
            PackFlow is an end-to-end Packaging Management System tailored specifically for modern packaging manufacturers, commercial printing presses, and box converters.
          </p>

          <p style={{
            fontSize: '1rem',
            color: '#64748B',
            lineHeight: '1.7',
            marginBottom: '2rem'
          }}>
            Our centralized platform helps packaging companies manage products, packaging orders, inventory, suppliers, and customers efficiently — eliminating manual errors and boosting plant productivity.
          </p>

          {/* Key Stat Badges */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #E2E8F0'
          }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0F4C81' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Centralized Control</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#F59E0B' }}>4 Modules</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Packaging Core</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981' }}>Zero</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Production Paperwork</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
