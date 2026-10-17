import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Instagram, Shield, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#0F172A',
      color: '#94A3B8',
      paddingTop: '4.5rem',
      paddingBottom: '2.5rem',
      borderTop: '4px solid #F59E0B'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '3rem'
      }}>
        {/* Company Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              background: '#F59E0B',
              color: '#0F172A',
              padding: '0.5rem',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={24} strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: '1.6rem',
              fontWeight: '800',
              color: '#ffffff',
              fontFamily: "'Outfit', sans-serif"
            }}>
              Pack<span style={{ color: '#F59E0B' }}>FLOW</span>
            </span>
          </div>
          <p style={{ lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.5rem', color: '#94A3B8' }}>
            Empowering packaging companies with next-generation digital management tools for enhanced efficiency, order tracking, and seamless workflow execution.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#linkedin" aria-label="LinkedIn" style={{ background: '#1E293B', color: '#CBD5E1', padding: '0.6rem', borderRadius: '50%', display: 'flex', transition: '0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#F59E0B'; e.currentTarget.style.color = '#0F172A'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#CBD5E1'; }}>
              <Linkedin size={18} />
            </a>
            <a href="#twitter" aria-label="Twitter" style={{ background: '#1E293B', color: '#CBD5E1', padding: '0.6rem', borderRadius: '50%', display: 'flex', transition: '0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#F59E0B'; e.currentTarget.style.color = '#0F172A'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#CBD5E1'; }}>
              <Twitter size={18} />
            </a>
            <a href="#facebook" aria-label="Facebook" style={{ background: '#1E293B', color: '#CBD5E1', padding: '0.6rem', borderRadius: '50%', display: 'flex', transition: '0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#F59E0B'; e.currentTarget.style.color = '#0F172A'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#CBD5E1'; }}>
              <Facebook size={18} />
            </a>
            <a href="#instagram" aria-label="Instagram" style={{ background: '#1E293B', color: '#CBD5E1', padding: '0.6rem', borderRadius: '50%', display: 'flex', transition: '0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#F59E0B'; e.currentTarget.style.color = '#0F172A'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#CBD5E1'; }}>
              <Instagram size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '1.25rem', fontWeight: '700' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <li><Link to="/" style={{ transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#F59E0B'} onMouseLeave={(e) => e.target.style.color = '#94A3B8'}>Home</Link></li>
            <li><a href="#services" style={{ transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#F59E0B'} onMouseLeave={(e) => e.target.style.color = '#94A3B8'}>Services</a></li>
            <li><a href="#about" style={{ transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#F59E0B'} onMouseLeave={(e) => e.target.style.color = '#94A3B8'}>About Us</a></li>
            <li><a href="#contact" style={{ transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#F59E0B'} onMouseLeave={(e) => e.target.style.color = '#94A3B8'}>Contact Support</a></li>
            <li><Link to="/login" style={{ transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#F59E0B'} onMouseLeave={(e) => e.target.style.color = '#94A3B8'}>Client Login</Link></li>
            <li><Link to="/register" style={{ transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#F59E0B'} onMouseLeave={(e) => e.target.style.color = '#94A3B8'}>Create Account</Link></li>
          </ul>
        </div>

        {/* Services Overview */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '1.25rem', fontWeight: '700' }}>Our Solutions</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <li>Industrial Packaging</li>
            <li>Custom Commercial Printing</li>
            <li>UV & Protective Coating</li>
            <li>Post Press & Finishing</li>
            <li>Inventory Tracking</li>
            <li>Order Lifecycle Control</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '1.25rem', fontWeight: '700' }}>Get In Touch</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <span>info@packflow.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <span>0705652577</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <MapPin size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '3px' }} />
              <span>26/11 Gonamaditha Road, Piliyandala, Sri Lanka</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        maxWidth: '1280px',
        margin: '3rem auto 0 auto',
        padding: '1.5rem 1.5rem 0 1.5rem',
        borderTop: '1px solid #1E293B',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        fontSize: '0.85rem'
      }}>
        <div>
          © {new Date().getFullYear()} PackFlow Systems Inc. All rights reserved. "Smart Packaging Management Solutions"
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="#privacy" style={{ transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#ffffff'} onMouseLeave={(e) => e.target.style.color = '#94A3B8'}>Privacy Policy</a>
          <a href="#terms" style={{ transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#ffffff'} onMouseLeave={(e) => e.target.style.color = '#94A3B8'}>Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
