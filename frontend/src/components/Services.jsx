import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Box, Printer, Sparkles, Scissors, Layers, ShieldCheck } from 'lucide-react';

export default function Services() {
  const navigate = useNavigate();

  const servicesData = [
    {
      id: 'packaging',
      title: 'Packaging',
      description: 'Custom corrugated boxes, rigid containers, and sustainable industrial packaging design.',
      icon: Box,
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      badge: 'Custom Corrugated'
    },
    {
      id: 'printing',
      title: 'Printing',
      description: 'High-precision offset & digital commercial printing for brand packaging excellence.',
      icon: Printer,
      image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80',
      badge: 'Offset & Digital'
    },
    {
      id: 'coating',
      title: 'Coating',
      description: 'UV varnish, aqueous coating, matte lamination, and barrier protective finishes.',
      icon: Sparkles,
      image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
      badge: 'UV & Lamination'
    },
    {
      id: 'post-press',
      title: 'Post Press',
      description: 'Precision die-cutting, embossing, foil stamping, folding, and gluing operations.',
      icon: Scissors,
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
      badge: 'Die-Cut & Finishing'
    }
  ];

  const handleCardClick = () => {
    navigate('/login');
  };

  return (
    <section id="services" style={{
      padding: '6rem 1.5rem',
      backgroundColor: '#F8FAFC',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 4rem auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--color-secondary-light)',
            color: 'var(--color-secondary-hover)',
            padding: '0.35rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            <span>Specialized Capabilities</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem' }}>
            Our Customized Services
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748B', lineHeight: '1.6' }}>
            Comprehensive packaging solutions engineered to meet demanding industrial and commercial requirements with total quality control.
          </p>
        </div>

        {/* 4 Service Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '2rem'
        }}>
          {servicesData.map((service) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.id}
                onClick={handleCardClick}
                className="card-rounded"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '1.5rem',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Image Container with Overlay */}
                <div style={{
                  position: 'relative',
                  height: '220px',
                  overflow: 'hidden',
                  background: '#1E293B'
                }}>
                  <img
                    src={service.image}
                    alt={service.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onError={(e) => {
                      // Fallback image if network fails
                      e.target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(15, 76, 129, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '99px',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    {service.badge}
                  </div>
                  {/* Floating Icon */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-1.25rem',
                    left: '1.5rem',
                    background: 'linear-gradient(135deg, #0F4C81 0%, #1E6CB0 100%)',
                    color: '#ffffff',
                    padding: '0.75rem',
                    borderRadius: '1rem',
                    boxShadow: '0 8px 20px rgba(15, 76, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconComponent size={24} />
                  </div>
                </div>

                {/* Card Content */}
                <div style={{
                  padding: '2rem 1.5rem 1.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      color: '#0F172A',
                      marginBottom: '0.6rem'
                    }}>
                      {service.title}
                    </h3>
                    <p style={{
                      fontSize: '0.925rem',
                      color: '#64748B',
                      lineHeight: '1.55',
                      marginBottom: '1.5rem'
                    }}>
                      {service.description}
                    </p>
                  </div>

                  {/* Action Link Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid #F1F5F9',
                    color: '#0F4C81',
                    fontWeight: '700',
                    fontSize: '0.9rem'
                  }}>
                    <span>Access Portal</span>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#EBF4FC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'var(--transition-fast)'
                    }}>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
