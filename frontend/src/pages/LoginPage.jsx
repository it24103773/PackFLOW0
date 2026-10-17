import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '../layouts/Header';
import Footer from '../layouts/Footer';
import { useAuth } from '../context/AuthContext';
import { Package, Mail, Lock, LogIn, AlertCircle, CheckCircle2, Shield, Layers, Warehouse, User, Truck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected after registration
  React.useEffect(() => {
    if (location.state?.registered) {
      setSuccessMessage('Registration Successful! Please log in with your credentials.');
    }
  }, [location]);

  const handleLoginSubmit = async (e, overrideEmail, overridePass) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const targetEmail = overrideEmail || email;
    const targetPass = overridePass || password;

    if (!targetEmail.trim() || !targetPass.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    try {
      setSubmitting(true);
      await login(targetEmail, targetPass);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Incorrect email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'senuraperera@packflow.com', pass: '12345678', icon: Shield, color: '#0F4C81' },
    { label: 'Packaging Manager', email: 'damsakdamsak@packflow.com', pass: '12345678', icon: Layers, color: '#D97706' },
    { label: 'Inventory Manager', email: 'bihanbihan@packflow.com', pass: '12345678', icon: Warehouse, color: '#3730A3' },
    { label: 'Supplier', email: 'yuthma@packflow.com', pass: '12345678', icon: Truck, color: '#6B21A8' },
    { label: 'Customer', email: 'customer@packflow.com', pass: '12345678', icon: User, color: '#059669' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <Header />

      <main style={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem'
      }}>
        <div className="card-rounded animate-fade-in" style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          padding: '2.5rem',
          borderRadius: '1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 40px rgba(15, 76, 129, 0.1)'
        }}>
          {/* Top Logo Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0F4C81 0%, #1E6CB0 100%)',
                color: '#ffffff',
                padding: '0.65rem',
                borderRadius: '0.85rem',
                display: 'flex',
                boxShadow: '0 4px 12px rgba(15, 76, 129, 0.25)'
              }}>
                <Package size={26} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F4C81', fontFamily: "'Outfit', sans-serif" }}>
                Pack<span style={{ color: '#F59E0B' }}>FLOW</span>
              </span>
            </Link>

            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', marginTop: '1.25rem', marginBottom: '0.35rem' }}>
              Stakeholder Login
            </h2>
          </div>

          {/* Messages */}
          {successMessage && (
            <div style={{
              background: '#D1FAE5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => handleLoginSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  required
                  placeholder="senuraperera@packflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ borderRadius: '4px', accentColor: '#0F4C81', width: '16px', height: '16px' }}
                />
                Remember Me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', opacity: submitting ? 0.7 : 1 }}
            >
              <LogIn size={18} />
              <span>{submitting ? 'Authenticating...' : 'Login'}</span>
            </button>
          </form>

          {/* Footer Navigation */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9', fontSize: '0.875rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              Customer Registration:{' '}
              <Link to="/register" style={{ color: '#F59E0B', fontWeight: '700', textDecoration: 'none' }}>
                Register Here
              </Link>
            </div>
            <div>
              Approved Supplier?{' '}
              <Link to="/supplier-register" style={{ color: '#581C87', fontWeight: '700', textDecoration: 'none' }}>
                Complete Registration with OTP &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
