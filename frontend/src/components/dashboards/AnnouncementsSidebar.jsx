import React, { useState, useEffect } from 'react';
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from '../../services/api';
import { Megaphone, Plus, Trash2, Tag, Calendar, User, AlertCircle, Info, Bell, X } from 'lucide-react';

export default function AnnouncementsSidebar({ user, token, userRole = 'Customer', compact = false }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    title: '',
    message: '',
    targetAudience: 'All',
    priority: 'Normal'
  });

  const roleLower = (userRole || user?.role || 'Customer').toLowerCase();
  const isAdmin = roleLower.includes('admin') || roleLower.includes('system administrator');

  useEffect(() => {
    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data || []);
    } catch (e) {
      console.error('Error fetching announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setFormError('Please fill in both title and message.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError('');
      await createAnnouncement({
        ...form,
        author: user?.fullName ? `${user.fullName} (${user.role || 'Admin'})` : 'System Administrator'
      }, token);
      setShowModal(false);
      setForm({ title: '', message: '', targetAudience: 'All', priority: 'Normal' });
      await loadAnnouncements();
    } catch (err) {
      setFormError(err.message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement(id, token);
      await loadAnnouncements();
    } catch (e) {
      alert('Failed to delete announcement: ' + e.message);
    }
  };

  // Filter based on target audience
  const filteredAnnouncements = announcements.filter(a => {
    if (isAdmin) return true;
    const target = (a.targetAudience || 'All').toLowerCase();
    if (target === 'all') return true;
    if (roleLower.includes('customer') && target.includes('customer')) return true;
    if (roleLower.includes('supplier') && target.includes('supplier')) return true;
    if ((roleLower.includes('packaging') || roleLower.includes('pm')) && (target.includes('packaging') || target.includes('pm'))) return true;
    if ((roleLower.includes('inventory') || roleLower.includes('im') || roleLower.includes('warehouse') || roleLower.includes('raw material')) && (target.includes('inventory') || target.includes('im'))) return true;
    return false;
  });

  const getPriorityStyle = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5', icon: AlertCircle };
      case 'important':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D', icon: Bell };
      default:
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', icon: Info };
    }
  };

  return (
    <div className="card-rounded" style={{
      padding: compact ? '1.25rem' : '1.5rem',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            padding: '0.45rem',
            borderRadius: '0.65rem',
            display: 'flex'
          }}>
            <Megaphone size={19} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              Announcements
            </h3>
            <span style={{ fontSize: '0.775rem', color: '#64748B', fontWeight: '600' }}>
              Broadcasts & Updates
            </span>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              backgroundColor: '#0F4C81',
              color: '#FFFFFF',
              borderRadius: '0.65rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              transition: '0.2s ease',
              boxShadow: '0 2px 6px rgba(15, 76, 129, 0.2)'
            }}
          >
            <Plus size={15} />
            <span>Announce</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#94A3B8', fontSize: '0.875rem' }}>
          Loading announcements...
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          backgroundColor: '#F8FAFC',
          borderRadius: '0.85rem',
          border: '1px dashed #CBD5E1',
          color: '#64748B',
          fontSize: '0.85rem'
        }}>
          No announcements active at the moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: compact ? '320px' : '450px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {filteredAnnouncements.map((item) => {
            const pStyle = getPriorityStyle(item.priority);
            const PriorityIcon = pStyle.icon;
            return (
              <div key={item.id} style={{
                padding: '1rem',
                borderRadius: '0.85rem',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderLeft: `4px solid ${pStyle.text}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '99px',
                    backgroundColor: pStyle.bg,
                    color: pStyle.text,
                    border: `1px solid ${pStyle.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <PriorityIcon size={12} />
                    {item.priority || 'Normal'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '99px',
                      backgroundColor: '#E2E8F0',
                      color: '#334155'
                    }}>
                      Audience: {item.targetAudience || 'All'}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete announcement"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          borderRadius: '0.35rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  {item.title}
                </h4>

                <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5, whitespace: 'pre-line' }}>
                  {item.message}
                </p>

                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: '#94A3B8',
                  paddingTop: '0.4rem',
                  borderTop: '1px solid #EDF2F7',
                  marginTop: '0.25rem'
                }}>
                  <span style={{ fontWeight: '600', color: '#64748B' }}>
                    By: {item.author || 'System Administrator'}
                  </span>
                  <span>
                    {item.createdAt ? item.createdAt.replace('T', ' ').substring(0, 16) : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Make Announcement Modal for Admin */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1.25rem',
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={22} style={{ color: '#0F4C81' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Publish New Announcement
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Scheduled System Optimization Notice"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.65rem',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Target Audience *
                  </label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="All">All Users & Partners</option>
                    <option value="Customers">Customers Only</option>
                    <option value="Suppliers">Suppliers Only</option>
                    <option value="Packaging Managers">Packaging Managers Only</option>
                    <option value="Inventory Managers">Inventory Managers Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Priority Tag *
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="Normal">Normal (Blue)</option>
                    <option value="Important">Important (Amber)</option>
                    <option value="Urgent">Urgent (Red)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Announcement Message Body *
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Enter details of the announcement to broadcast across dashboard panels..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.65rem',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '0.65rem',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '0.65rem',
                    border: 'none',
                    backgroundColor: '#0F4C81',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
