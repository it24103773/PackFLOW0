import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../layouts/Header';
import Footer from '../layouts/Footer';
import { useAuth } from '../context/AuthContext';
import { submitPackagingRequirement, fetchPackagingTypes } from '../services/api';
import { Package, User, Mail, Lock, Phone, UserPlus, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Optional Initial Order Requirement State
  const [includeRequirement, setIncludeRequirement] = useState(true);
  const [availablePackagingTypes, setAvailablePackagingTypes] = useState([]);
  const [packagingType, setPackagingType] = useState('Corrugated Box');
  const [lengthMm, setLengthMm] = useState('300');
  const [widthMm, setWidthMm] = useState('200');
  const [heightMm, setHeightMm] = useState('150');
  const [quantity, setQuantity] = useState('1000');
  const [printFinish, setPrintFinish] = useState('Full Color Offset + Matte Finish');
  const [notes, setNotes] = useState('Initial customer order requirements submitted during registration.');

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPackagingTypes();
  }, []);

  const loadPackagingTypes = async () => {
    try {
      const data = await fetchPackagingTypes();
      if (Array.isArray(data) && data.length > 0) {
        setAvailablePackagingTypes(data);
        if (data[0]?.typeName) {
          setPackagingType(data[0].typeName);
        }
      }
    } catch (e) {
      console.warn('Failed to load dynamic packaging types during registration:', e.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !mobileNumber.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('All mandatory registration fields (including Contact Mobile Number) are required.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await register(fullName, email, mobileNumber, password, confirmPassword);

      if (includeRequirement) {
        try {
          const dims = `${lengthMm} x ${widthMm} x ${heightMm} mm`;
          await submitPackagingRequirement({
            customerName: fullName.trim(),
            customerEmail: email.trim().toLowerCase(),
            packagingType,
            dimensions: dims,
            quantity: Number(quantity) || 500,
            printFinish,
            notes: `Contact: ${mobileNumber} | Notes: ${notes}`,
            status: 'Pending Admin Registration',
            progressPercentage: 0
          });
        } catch (e) {
          console.warn('Initial requirement submission warning:', e.message);
        }
      }

      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

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
          maxWidth: '560px',
          background: '#FFFFFF',
          padding: '2.5rem',
          borderRadius: '1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 40px rgba(15, 76, 129, 0.1)'
        }}>
          {/* Top Logo Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
              Customer Registration
            </h2>
          </div>

          {/* Validation Error Message */}
          {errorMessage && (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  required
                  placeholder="Nimal Jayasinghe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  required
                  placeholder="nimal@gmail.com"
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
                Contact / Mobile Number *
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 234-5678"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
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
                Password (Min 8 characters) *
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

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            {/* Optional Initial Order Requirement Section */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '0.85rem', overflow: 'hidden', marginTop: '0.5rem' }}>
              <div
                onClick={() => setIncludeRequirement(!includeRequirement)}
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: '#0F4C81'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} style={{ color: '#F59E0B' }} />
                  <span>Initial Packaging Order Requirement (Recommended)</span>
                </div>
                {includeRequirement ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {includeRequirement && (
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: '#FFFFFF' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Packaging Type</label>
                    <select value={packagingType} onChange={(e) => setPackagingType(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}>
                      {availablePackagingTypes.length > 0 ? (
                        availablePackagingTypes.map((t) => (
                          <option key={t.id || t.typeName} value={t.typeName}>
                            {t.typeName}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Corrugated Box">Corrugated Box</option>
                          <option value="Rigid Premium Box">Rigid Premium Box</option>
                          <option value="Folding Carton">Folding Carton</option>
                          <option value="Flexible Pouch">Flexible Pouch</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#334155' }}>Length (mm)</label>
                      <input type="number" value={lengthMm} onChange={(e) => setLengthMm(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#334155' }}>Width (mm)</label>
                      <input type="number" value={widthMm} onChange={(e) => setWidthMm(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#334155' }}>Height (mm)</label>
                      <input type="number" value={heightMm} onChange={(e) => setHeightMm(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Required Quantity (Units)</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Print & Finish Specs</label>
                    <input type="text" value={printFinish} onChange={(e) => setPrintFinish(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Requirement Notes</label>
                    <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', opacity: submitting ? 0.7 : 1 }}
            >
              <UserPlus size={18} />
              <span>{submitting ? 'Registering Customer Account...' : 'Register Customer Account'}</span>
            </button>
          </form>

          {/* Footer Navigation */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9', fontSize: '0.875rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div>
              Already registered?{' '}
              <Link to="/login" style={{ color: '#0F4C81', fontWeight: '700', textDecoration: 'none' }}>
                Login Here
              </Link>
            </div>
            <div>
              Approved Supplier?{' '}
              <Link to="/supplier-register" style={{ color: '#581C87', fontWeight: '700', textDecoration: 'none' }}>
                Register as Supplier with OTP &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

