import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, ArrowRight, Menu, X, LogIn, UserPlus } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className={`sticky-header ${isScrolled ? 'scrolled' : ''}`}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0F4C81 0%, #1E6CB0 100%)',
            color: '#ffffff',
            padding: '0.6rem',
            borderRadius: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 76, 129, 0.25)'
          }}>
            <Package size={26} strokeWidth={2.2} />
          </div>
          <div>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#0F4C81',
              letterSpacing: '-0.02em',
              fontFamily: "'Outfit', sans-serif"
            }}>
              Pack<span style={{ color: '#F59E0B' }}>FLOW</span>
            </span>
            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '-4px' }}>
              Packaging Platform
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2.5rem'
        }} className="desktop-nav">
          <button 
            onClick={() => handleNavClick('hero')} 
            style={{ fontWeight: '600', fontSize: '0.95rem', color: '#334155', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#0F4C81'}
            onMouseLeave={(e) => e.target.style.color = '#334155'}
          >
            Home
          </button>
          <button 
            onClick={() => handleNavClick('services')} 
            style={{ fontWeight: '600', fontSize: '0.95rem', color: '#334155', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#0F4C81'}
            onMouseLeave={(e) => e.target.style.color = '#334155'}
          >
            Services
          </button>
          <button 
            onClick={() => handleNavClick('about')} 
            style={{ fontWeight: '600', fontSize: '0.95rem', color: '#334155', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#0F4C81'}
            onMouseLeave={(e) => e.target.style.color = '#334155'}
          >
            About
          </button>
          <button 
            onClick={() => handleNavClick('contact')} 
            style={{ fontWeight: '600', fontSize: '0.95rem', color: '#334155', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#0F4C81'}
            onMouseLeave={(e) => e.target.style.color = '#334155'}
          >
            Contact
          </button>
        </nav>

        {/* Right CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }} className="desktop-actions">
          <Link to="/login" className="btn-outline" style={{ padding: '0.55rem 1.35rem', fontSize: '0.9rem' }}>
            <LogIn size={17} />
            <span>Login</span>
          </Link>
          <Link to="/register" className="btn-secondary" style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem' }}>
            <UserPlus size={17} />
            <span>Register</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          style={{ display: 'none', padding: '0.5rem', color: '#0F4C81' }}
          className="mobile-toggle"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #E2E8F0',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <button onClick={() => handleNavClick('hero')} style={{ textAlign: 'left', fontWeight: '600', padding: '0.5rem 0', color: '#0F4C81' }}>Home</button>
          <button onClick={() => handleNavClick('services')} style={{ textAlign: 'left', fontWeight: '600', padding: '0.5rem 0', color: '#334155' }}>Services</button>
          <button onClick={() => handleNavClick('about')} style={{ textAlign: 'left', fontWeight: '600', padding: '0.5rem 0', color: '#334155' }}>About</button>
          <button onClick={() => handleNavClick('contact')} style={{ textAlign: 'left', fontWeight: '600', padding: '0.5rem 0', color: '#334155' }}>Contact</button>
          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '0.5rem 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/login" className="btn-outline" onClick={() => setMobileMenuOpen(false)}>Login</Link>
            <Link to="/register" className="btn-secondary" onClick={() => setMobileMenuOpen(false)}>Register</Link>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS rules for navbar toggle */}
      <style>{`
        @media (max-width: 868px) {
          .desktop-nav, .desktop-actions { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
}
