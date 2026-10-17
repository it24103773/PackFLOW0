import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../layouts/Header';
import Footer from '../layouts/Footer';
import { requestSupplierOtp, verifySupplierOtp, completeSupplierRegistration } from '../services/api';
import {
  Truck,
  Mail,
  Lock,
  KeyRound,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Building2
} from 'lucide-react';

export default function SupplierRegisterPage() {
  const navigate = useNavigate();

  // Step 1: Email, Step 2: OTP Verification, Step 3: Credentials Setup
  const [step, setStep] = useState(1);

  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Messaging State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  // STEP 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your approved business email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await requestSupplierOtp(email.trim());
      setInfoMessage(res.message || 'OTP verification code sent directly to your email inbox.');
      setStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the valid 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifySupplierOtp(email.trim(), otp.trim());
      setInfoMessage(res.message || 'OTP Code Verified! Proceed to set your custom password.');
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Complete Supplier Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Please provide password and password confirmation.');
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
      setLoading(true);
      await completeSupplierRegistration({
        email: email.trim(),
        otp: otp.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim()
      });

      navigate('/login', {
        state: {
          registered: true,
          supplierMessage: 'Supplier registration completed successfully! Log in with your new credentials.'
        }
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete supplier registration.');
    } finally {
      setLoading(false);
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
          maxWidth: '580px',
          background: '#FFFFFF',
          padding: '2.5rem',
          borderRadius: '1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 40px rgba(88, 28, 135, 0.1)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #581C87 0%, #3B0764 100%)',
                color: '#ffffff',
                padding: '0.65rem',
                borderRadius: '0.85rem',
                display: 'flex',
                boxShadow: '0 4px 12px rgba(88, 28, 135, 0.25)'
              }}>
                <Truck size={26} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#581C87', fontFamily: "'Outfit', sans-serif" }}>
                Pack<span style={{ color: '#F59E0B' }}>FLOW</span> <span style={{ fontSize: '0.9rem', color: '#6B21A8', fontWeight: '700' }}>Supplier Portal</span>
              </span>
            </Link>

            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', marginTop: '1.25rem', marginBottom: '0.35rem' }}>
              Verified Supplier Registration
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
              Complete registration for Admin-verified supplier inquiries using email OTP verification.
            </p>
          </div>

          {/* Stepper Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: step >= 1 ? '#581C87' : '#E2E8F0',
                color: step >= 1 ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.9rem'
              }}>1</div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: step >= 1 ? '#581C87' : '#94A3B8' }}>Request OTP</span>
            </div>

            <div style={{ flex: 1, height: '2px', backgroundColor: step >= 2 ? '#581C87' : '#E2E8F0', margin: '0 0.5rem', marginBottom: '1rem' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: step >= 2 ? '#581C87' : '#E2E8F0',
                color: step >= 2 ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.9rem'
              }}>2</div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: step >= 2 ? '#581C87' : '#94A3B8' }}>Verify OTP</span>
            </div>

            <div style={{ flex: 1, height: '2px', backgroundColor: step >= 3 ? '#581C87' : '#E2E8F0', margin: '0 0.5rem', marginBottom: '1rem' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: step >= 3 ? '#581C87' : '#E2E8F0',
                color: step >= 3 ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.9rem'
              }}>3</div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: step >= 3 ? '#581C87' : '#94A3B8' }}>Set Password</span>
            </div>
          </div>

          {/* Alert Messages */}
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

          {infoMessage && (
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              color: '#166534',
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#16A34A' }} />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: Enter Business Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                  Approved Business Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="email"
                    required
                    placeholder="supplier@company.com"
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
                <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '0.35rem' }}>
                  Must match the business email submitted during inquiry and approved by Admin.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem', backgroundColor: '#581C87', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Requesting Code...' : 'Send OTP Verification Code'}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* STEP 2: Enter & Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                  Enter 6-Digit Verification Code (OTP) *
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 582910"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      borderRadius: '0.75rem',
                      border: '1.5px solid #6B21A8',
                      fontSize: '1.2rem',
                      fontWeight: '800',
                      letterSpacing: '4px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', color: '#334155', fontWeight: '700' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ flex: 2, padding: '0.75rem', backgroundColor: '#581C87', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {loading ? 'Verifying OTP...' : 'Verify OTP Code'}
                  <ShieldCheck size={18} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Provide Credentials & Complete Registration */}
          {step === 3 && (
            <form onSubmit={handleCompleteRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Supplier Representative Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Contact Representative"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.75rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Mobile / Contact Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="+94 77 123 4567"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.75rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Supplier Account Password (Min 8 characters) *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.75rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
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
                    style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.75rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', backgroundColor: '#581C87', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Completing Registration...' : 'Register Password & Complete Supplier Account'}
                <CheckCircle2 size={18} />
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9', fontSize: '0.875rem', color: '#64748B' }}>
            Already completed registration?{' '}
            <Link to="/login" style={{ color: '#581C87', fontWeight: '700', textDecoration: 'none' }}>
              Supplier Login Here
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
