import React from 'react';
import { ArrowRight, Package, Sparkles, Layers, Box, CheckCircle2 } from 'lucide-react';

export default function Hero({ onExploreClick }) {
  return (
    <section id="hero" style={{
      position: 'relative',
      padding: '4rem 1.5rem 6rem 1.5rem',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
      overflow: 'hidden'
    }}>
      {/* Background Decor Gradients */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(15, 76, 129, 0.08) 0%, rgba(245, 158, 11, 0.04) 50%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '4rem',
        alignItems: 'center'
      }}>
        {/* Hero Text Content */}
        <div>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(15, 76, 129, 0.08)'
          }}>
            <Sparkles size={16} style={{ color: '#F59E0B' }} />
            <span>Next-Gen Packaging Ecosystem</span>
          </div>

          <h1 style={{
            fontSize: 'calc(2.2rem + 1.5vw)',
            fontWeight: '800',
            color: '#0F172A',
            letterSpacing: '-0.03em',
            lineHeight: '1.15',
            marginBottom: '1.25rem'
          }}>
            Smart Packaging <br />
            <span style={{
              background: 'linear-gradient(135deg, #0F4C81 0%, #1E6CB0 60%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Management Solutions
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#475569',
            lineHeight: '1.65',
            marginBottom: '2.25rem',
            maxWidth: '540px'
          }}>
            PackFlow helps businesses manage packaging operations efficiently through a centralized digital platform — unifying orders, inventory, and production workflows.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <button 
              onClick={onExploreClick} 
              className="btn-primary" 
              style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}
            >
              <span>Explore Services</span>
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={onExploreClick} 
              className="btn-secondary" 
              style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}
            >
              <span>Get Started</span>
            </button>
          </div>

          {/* Highlights Checklist */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: '#64748B', fontSize: '0.9rem', fontWeight: '600' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={18} style={{ color: '#0F4C81' }} />
              <span>Real-time Tracking</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={18} style={{ color: '#0F4C81' }} />
              <span>Automated Post-Press</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={18} style={{ color: '#F59E0B' }} />
              <span>Modular Scalability</span>
            </div>
          </div>
        </div>

        {/* Hero Graphic / Illustration */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          {/* Main Illustration Box Container */}
          <div className="card-rounded animate-float" style={{
            width: '100%',
            maxWidth: '520px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)',
            padding: '2.5rem',
            borderRadius: '2rem',
            boxShadow: '0 25px 50px -12px rgba(15, 76, 129, 0.18)',
            border: '1px solid rgba(15, 76, 129, 0.12)',
            position: 'relative'
          }}>
            {/* SVG Interactive Graphic */}
            <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
              {/* Background Warehouse Grid Base */}
              <rect x="20" y="220" width="360" height="80" rx="12" fill="#E2E8F0" opacity="0.6" />
              <line x1="40" y1="260" x2="360" y2="260" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" />

              {/* Main Box - Packaging Container */}
              <g transform="translate(100, 70)">
                {/* Box Left Side */}
                <path d="M0 60 L100 110 L100 200 L0 150 Z" fill="#0F4C81" />
                {/* Box Right Side */}
                <path d="M100 110 L200 60 L200 150 L100 200 Z" fill="#1E6CB0" />
                {/* Box Top Side */}
                <path d="M0 60 L100 10 L200 60 L100 110 Z" fill="#F59E0B" />
                {/* Tape detail */}
                <path d="M80 20 L120 40 L120 180 L80 160 Z" fill="rgba(255, 255, 255, 0.25)" />
                {/* Tape seal */}
                <path d="M70 25 L130 55" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              </g>

              {/* Secondary Floating Boxes */}
              <g transform="translate(40, 140)">
                <path d="M0 30 L45 52 L45 95 L0 73 Z" fill="#1E293B" />
                <path d="M45 52 L90 30 L90 73 L45 95 Z" fill="#334155" />
                <path d="M0 30 L45 8 L90 30 L45 52 Z" fill="#F59E0B" opacity="0.9" />
              </g>

              <g transform="translate(260, 130)">
                <path d="M0 35 L50 60 L50 110 L0 85 Z" fill="#0A3A64" />
                <path d="M50 60 L100 35 L100 85 L50 110 Z" fill="#0F4C81" />
                <path d="M0 35 L50 10 L100 35 L50 60 Z" fill="#38BDF8" />
              </g>

              {/* Status Pills Floating */}
              <g transform="translate(20, 20)">
                <rect x="0" y="0" width="130" height="36" rx="18" fill="#FFFFFF" filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.08))" />
                <circle cx="18" cy="18" r="6" fill="#10B981" />
                <text x="32" y="22" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="sans-serif">Orders Synced</text>
              </g>

              <g transform="translate(250, 15)">
                <rect x="0" y="0" width="135" height="36" rx="18" fill="#FFFFFF" filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.08))" />
                <circle cx="18" cy="18" r="6" fill="#F59E0B" />
                <text x="32" y="22" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="sans-serif">Post Press Ready</text>
              </g>
            </svg>

            {/* Bottom Card Stat */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem 1.25rem',
              background: '#FFFFFF',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#EBF4FC', color: '#0F4C81', padding: '0.5rem', borderRadius: '0.6rem' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A' }}>Integrated Digital Flow</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Smart packaging & print management</div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10B981', background: '#D1FAE5', padding: '0.25rem 0.6rem', borderRadius: '99px' }}>
                99.9% Uptime
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
