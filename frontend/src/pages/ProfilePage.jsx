import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { fetchMyCustomerProfile, updateMyCustomerProfile } from '../services/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Edit3,
  Save,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Check
} from 'lucide-react';

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    id: user?.id || null,
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || '',
    address: '',
    role: user?.role || 'Customer',
    status: user?.status || 'REGISTERED',
    registrationDate: user?.registrationDate || '',
    totalOrders: 0
  });

  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [token]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await fetchMyCustomerProfile(token);
      setProfileData(data);
      setFormData({
        fullName: data.fullName || '',
        mobileNumber: data.mobileNumber || '',
        address: data.address || '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Fallback to auth context state
      setProfileData({
        id: user?.id,
        fullName: user?.fullName || '',
        email: user?.email || '',
        mobileNumber: user?.mobileNumber || '',
        address: '',
        role: user?.role || 'Customer',
        status: user?.status || 'REGISTERED',
        registrationDate: user?.registrationDate || '',
        totalOrders: 0
      });
      setFormData({
        fullName: user?.fullName || '',
        mobileNumber: user?.mobileNumber || '',
        address: '',
        password: '',
        confirmPassword: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditing = () => {
    setFormData({
      fullName: profileData.fullName || '',
      mobileNumber: profileData.mobileNumber || '',
      address: profileData.address || '',
      password: '',
      confirmPassword: ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowPasswordSection(false);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setErrorMsg('');
    setSuccessMsg('');
    setShowPasswordSection(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }

    if (showPasswordSection && formData.password) {
      if (formData.password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg('New password and confirmation password do not match.');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        fullName: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        address: formData.address.trim()
      };

      if (showPasswordSection && formData.password) {
        payload.password = formData.password;
      }

      const res = await updateMyCustomerProfile(payload, token);

      const updatedUser = res.user || payload;
      setProfileData((prev) => ({
        ...prev,
        fullName: updatedUser.fullName || payload.fullName,
        mobileNumber: updatedUser.mobileNumber || payload.mobileNumber,
        address: updatedUser.address !== undefined ? updatedUser.address : payload.address
      }));

      // Update AuthContext so Header and Sidebar reflect change immediately
      if (updateUser) {
        updateUser({
          fullName: updatedUser.fullName || payload.fullName,
          mobileNumber: updatedUser.mobileNumber || payload.mobileNumber
        });
      }

      setSuccessMsg('Customer profile information updated successfully!');
      setIsEditing(false);
      setShowPasswordSection(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update customer profile');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = profileData?.registrationDate
    ? new Date(profileData.registrationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        {/* Header Title Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.35rem' }}>
              My Profile
            </h1>
          </div>

          {!isEditing && !loading && (
            <button
              onClick={handleStartEditing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#0F4C81',
                color: '#FFFFFF',
                padding: '0.75rem 1.35rem',
                borderRadius: '0.85rem',
                fontSize: '0.925rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(15, 76, 129, 0.25)',
                transition: '0.2s ease'
              }}
            >
              <Edit3 size={18} />
              <span>Edit Profile Information</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {successMsg && (
          <div style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#D1FAE5',
            color: '#065F46',
            borderRadius: '1rem',
            border: '1px solid #A7F3D0',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: '600',
            fontSize: '0.925rem'
          }}>
            <CheckCircle2 size={20} style={{ flexShrink: 0, color: '#10B981' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '1rem',
            border: '1px solid #FCA5A5',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: '600',
            fontSize: '0.925rem'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, color: '#EF4444' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{
            padding: '4rem',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: '1.75rem',
            border: '1px solid #E2E8F0',
            color: '#64748B'
          }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#0F4C81' }} />
            <p style={{ fontWeight: '600' }}>Loading profile records...</p>
          </div>
        ) : (
          <div className="card-rounded" style={{
            padding: '2.5rem',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '1.75rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            {/* Customer Avatar & Hero Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '2rem',
              borderBottom: '1px solid #F1F5F9',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0F4C81 0%, #1E6CB0 100%)',
                  color: '#FFFFFF',
                  fontSize: '2.2rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 22px rgba(15, 76, 129, 0.25)',
                  border: '3px solid #EBF4FC'
                }}>
                  {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'C'}
                </div>

                <div>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.35rem' }}>
                    {profileData.fullName || 'Customer Profile'}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: '#FEF3C7',
                      color: '#D97706',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '99px',
                      fontSize: '0.825rem',
                      fontWeight: '700'
                    }}>
                      <Shield size={15} />
                      <span>{profileData.role || 'Customer'}</span>
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: profileData.status === 'REGISTERED' ? '#D1FAE5' : '#FEF3C7',
                      color: profileData.status === 'REGISTERED' ? '#059669' : '#D97706',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '99px',
                      fontSize: '0.825rem',
                      fontWeight: '700'
                    }}>
                      <CheckCircle2 size={15} />
                      <span>{profileData.status || 'REGISTERED'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {profileData.totalOrders !== undefined && profileData.totalOrders > 0 && (
                <div style={{
                  padding: '0.85rem 1.25rem',
                  background: '#F8FAFC',
                  borderRadius: '1rem',
                  border: '1px solid #E2E8F0',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Active Customer Orders</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F4C81', marginTop: '0.1rem' }}>
                    {profileData.totalOrders} {profileData.totalOrders === 1 ? 'Order' : 'Orders'}
                  </div>
                </div>
              )}
            </div>

            {/* Profile View / Edit Mode */}
            {!isEditing ? (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '2rem'
                }}>
                  {/* Full Name */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: '#EBF4FC', color: '#0F4C81', padding: '0.75rem', borderRadius: '0.85rem' }}>
                      <User size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Full Name</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', marginTop: '0.25rem' }}>
                        {profileData.fullName || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: '#FEF3C7', color: '#D97706', padding: '0.75rem', borderRadius: '0.85rem' }}>
                      <Mail size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Email Address</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', marginTop: '0.25rem' }}>
                        {profileData.email || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: '#D1FAE5', color: '#059669', padding: '0.75rem', borderRadius: '0.85rem' }}>
                      <Phone size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Mobile / Phone Number</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', marginTop: '0.25rem' }}>
                        {profileData.mobileNumber || 'Not specified'}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: '#F3E8FF', color: '#7E22CE', padding: '0.75rem', borderRadius: '0.85rem' }}>
                      <MapPin size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Delivery / Business Address</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A', marginTop: '0.25rem' }}>
                        {profileData.address || 'No address specified'}
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: '#F1F5F9', color: '#475569', padding: '0.75rem', borderRadius: '0.85rem' }}>
                      <Shield size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Account Role</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', marginTop: '0.25rem' }}>
                        {profileData.role || 'Customer'}
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: '#EEF2FF', color: '#6366F1', padding: '0.75rem', borderRadius: '0.85rem' }}>
                      <Calendar size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Registration Date</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A', marginTop: '0.25rem' }}>
                        {formattedDate}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Editable Profile Form */
              <form onSubmit={handleSubmit}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.75rem'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>
                    Edit Customer Profile Information
                  </h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
                    Fields marked with <span style={{ color: '#EF4444' }}>*</span> are required
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  {/* Full Name Field */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                      Full Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Enter your full name"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem 0.75rem 2.8rem',
                          borderRadius: '0.75rem',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.95rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Email Address (Read-only) & Mobile Number */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                        Email Address (Read-Only)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                          type="email"
                          value={profileData.email}
                          disabled
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.8rem',
                            borderRadius: '0.75rem',
                            border: '1.5px solid #E2E8F0',
                            backgroundColor: '#F1F5F9',
                            color: '#64748B',
                            fontSize: '0.95rem',
                            boxSizing: 'border-box',
                            cursor: 'not-allowed'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                        Mobile / Phone Number
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                          type="text"
                          value={formData.mobileNumber}
                          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                          placeholder="e.g. +1 (555) 876-1234 or 0701234567"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.8rem',
                            borderRadius: '0.75rem',
                            border: '1.5px solid #CBD5E1',
                            fontSize: '0.95rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Field */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                      Delivery / Business Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: '#94A3B8' }} />
                      <textarea
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter your street address, city, and postal code"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem 0.75rem 2.8rem',
                          borderRadius: '0.75rem',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.95rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  {/* Password Toggle Button */}
                  <div style={{
                    padding: '1.25rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '1rem',
                    border: '1px solid #E2E8F0'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: '#0F4C81',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <Lock size={17} />
                      <span>{showPasswordSection ? 'Cancel Password Change' : 'Change Password (Optional)'}</span>
                    </button>

                    {showPasswordSection && (
                      <div style={{
                        marginTop: '1.25rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1.25rem',
                        paddingTop: '1.25rem',
                        borderTop: '1px solid #E2E8F0'
                      }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem' }}>
                            New Password
                          </label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="At least 8 characters"
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '0.65rem',
                              border: '1.5px solid #CBD5E1',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem' }}>
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Re-enter new password"
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '0.65rem',
                              border: '1.5px solid #CBD5E1',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Submit & Cancel Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '2.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid #F1F5F9'
                }}>
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    disabled={saving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      padding: '0.75rem 1.35rem',
                      borderRadius: '0.85rem',
                      fontSize: '0.925rem',
                      fontWeight: '700',
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <X size={18} />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#0F4C81',
                      color: '#FFFFFF',
                      padding: '0.75rem 1.75rem',
                      borderRadius: '0.85rem',
                      fontSize: '0.925rem',
                      fontWeight: '700',
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(15, 76, 129, 0.25)'
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

