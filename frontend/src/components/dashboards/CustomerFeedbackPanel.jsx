import React, { useState, useEffect } from 'react';
import { fetchMyFeedbacks, submitFeedback } from '../../services/api';
import { MessageSquare, Star, Send, CheckCircle2, Clock, MessageCircle, AlertCircle } from 'lucide-react';

export default function CustomerFeedbackPanel({ user, token }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    subject: '',
    rating: 5,
    message: ''
  });

  useEffect(() => {
    loadMyFeedbacks();
  }, []);

  const loadMyFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await fetchMyFeedbacks(token);
      setFeedbacks(data || []);
    } catch (e) {
      console.error('Error loading feedbacks:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setErrorMsg('Please enter both subject and message.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      await submitFeedback({
        subject: form.subject.trim(),
        rating: form.rating,
        message: form.message.trim()
      }, token);

      setSuccessMsg('Thank you! Your feedback has been submitted successfully.');
      setForm({ subject: '', rating: 5, message: '' });
      await loadMyFeedbacks();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Banner */}
      <div className="card-rounded" style={{
        padding: '1.5rem 2rem',
        background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A8A 100%)',
        color: '#FFFFFF',
        borderRadius: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.3rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            <MessageSquare size={15} style={{ color: '#F59E0B' }} />
            <span>Customer Experience & Satisfaction</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>Customer Feedback & Support Center</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
        {/* Left Column: Submit Feedback Form */}
        <div className="card-rounded" style={{
          padding: '1.5rem',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} style={{ color: '#0F4C81' }} />
            <span>Submit Feedback</span>
          </h3>

          {successMsg && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.65rem', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.65rem', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                Feedback Subject / Topic *
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Corrugated Box Strength & Delivery Satisfaction"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '0.65rem',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                Satisfaction Rating *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      color: star <= form.rating ? '#F59E0B' : '#CBD5E1',
                      transition: 'transform 0.1s ease'
                    }}
                  >
                    <Star size={28} fill={star <= form.rating ? '#F59E0B' : 'transparent'} />
                  </button>
                ))}
                <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A', marginLeft: '0.5rem' }}>
                  {form.rating} / 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                Feedback Message / Comments *
              </label>
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Share your experience regarding packaging materials, print finish, delivery speed, or custom requests..."
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '0.65rem',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.75rem 1.25rem',
                backgroundColor: '#0F4C81',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.65rem',
                fontSize: '0.925rem',
                fontWeight: '800',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(15, 76, 129, 0.25)',
                transition: '0.2s ease'
              }}
            >
              <Send size={18} />
              <span>{submitting ? 'Submitting...' : 'Send Feedback to Admin'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Feedback History & Admin Responses */}
        <div className="card-rounded" style={{
          padding: '1.5rem',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={18} style={{ color: '#059669' }} />
              <span>Your Submissions & Admin Responses</span>
            </h3>
            <span style={{ fontSize: '0.775rem', fontWeight: '700', padding: '0.2rem 0.65rem', borderRadius: '99px', backgroundColor: '#E2E8F0', color: '#334155' }}>
              {feedbacks.length} Entries
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748B', fontSize: '0.9rem' }}>
              Loading your feedback history...
            </div>
          ) : feedbacks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '0.85rem',
              border: '1px dashed #CBD5E1',
              color: '#64748B',
              fontSize: '0.875rem'
            }}>
              You haven't submitted any feedback yet. Submit your first review above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '540px', overflowY: 'auto', paddingRight: '0.35rem' }}>
              {feedbacks.map((item) => {
                const isResponded = (item.status || '').toLowerCase().includes('responded');
                return (
                  <div key={item.id} style={{
                    padding: '1.15rem',
                    borderRadius: '0.85rem',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.725rem',
                        fontWeight: '800',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '99px',
                        backgroundColor: isResponded ? '#D1FAE5' : '#FEF3C7',
                        color: isResponded ? '#065F46' : '#92400E',
                        border: isResponded ? '1px solid #6EE7B7' : '1px solid #FCD34D',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        {isResponded ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {item.status || 'Pending Response'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} fill={s <= (item.rating || 5) ? '#F59E0B' : '#E2E8F0'} color={s <= (item.rating || 5) ? '#F59E0B' : '#CBD5E1'} />
                        ))}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '0.975rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      {item.subject}
                    </h4>

                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.55 }}>
                      "{item.message}"
                    </p>

                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '500' }}>
                      Submitted on: {item.createdAt ? item.createdAt.replace('T', ' ').substring(0, 16) : ''}
                    </div>

                    {/* Admin Response Box if Responded */}
                    {isResponded && item.adminResponse && (
                      <div style={{
                        marginTop: '0.35rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '0.65rem',
                        backgroundColor: '#ECFDF5',
                        border: '1.5px solid #6EE7B7',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}>
                        <div style={{ fontSize: '0.775rem', fontWeight: '800', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MessageSquare size={14} />
                          <span>PackFLOW Management Response:</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#047857', margin: 0, fontWeight: '500', lineHeight: 1.5 }}>
                          "{item.adminResponse}"
                        </p>
                        <div style={{ fontSize: '0.725rem', color: '#059669', textAlign: 'right', fontWeight: '600' }}>
                          By: {item.respondedBy || 'System Administrator'} ({item.respondedAt ? item.respondedAt.replace('T', ' ').substring(0, 16) : ''})
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
