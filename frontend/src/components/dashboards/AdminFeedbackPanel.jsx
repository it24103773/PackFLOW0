import React, { useState, useEffect } from 'react';
import { fetchAllFeedbacks, respondToFeedback, deleteFeedback } from '../../services/api';
import { MessageSquare, Star, Send, CheckCircle2, Clock, Filter, User, Mail, Calendar, X, Trash2 } from 'lucide-react';

export default function AdminFeedbackPanel({ token }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'responded'
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadFeedbacks();
    const interval = setInterval(loadFeedbacks, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadFeedbacks = async () => {
    try {
      const data = await fetchAllFeedbacks();
      setFeedbacks(data || []);
    } catch (e) {
      console.error('Error loading customer feedbacks:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRespond = (item) => {
    setSelectedFeedback(item);
    setResponseText(item.adminResponse || '');
    setErrorMsg('');
  };

  const handleDeleteFeedback = async (item) => {
    if (!window.confirm(`Are you sure you want to delete feedback #${item.id} ("${item.subject}") from ${item.customerName || 'customer'}?`)) {
      return;
    }
    try {
      await deleteFeedback(item.id, token);
      await loadFeedbacks();
    } catch (err) {
      alert(err.message || 'Failed to delete feedback');
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      setErrorMsg('Please enter a response message before sending.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await respondToFeedback(selectedFeedback.id, responseText.trim(), token);
      setSelectedFeedback(null);
      setResponseText('');
      await loadFeedbacks();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send response.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filterStatus === 'pending') {
      return (f.status || '').toLowerCase().includes('pending');
    }
    if (filterStatus === 'responded') {
      return (f.status || '').toLowerCase().includes('responded');
    }
    return true;
  });

  const pendingCount = feedbacks.filter(f => (f.status || '').toLowerCase().includes('pending')).length;
  const respondedCount = feedbacks.filter(f => (f.status || '').toLowerCase().includes('responded')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Controls */}
      <div className="card-rounded" style={{
        padding: '1.5rem',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquare size={22} style={{ color: '#0F4C81' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              Customer Feedbacks & Reviews
            </h3>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#F1F5F9', padding: '0.3rem', borderRadius: '0.75rem' }}>
          <button
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filterStatus === 'all' ? '#FFFFFF' : 'transparent',
              color: filterStatus === 'all' ? '#0F4C81' : '#64748B',
              boxShadow: filterStatus === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            All ({feedbacks.length})
          </button>

          <button
            onClick={() => setFilterStatus('pending')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filterStatus === 'pending' ? '#FFFFFF' : 'transparent',
              color: filterStatus === 'pending' ? '#D97706' : '#64748B',
              boxShadow: filterStatus === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Pending ({pendingCount})
          </button>

          <button
            onClick={() => setFilterStatus('responded')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filterStatus === 'responded' ? '#FFFFFF' : 'transparent',
              color: filterStatus === 'responded' ? '#059669' : '#64748B',
              boxShadow: filterStatus === 'responded' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Responded ({respondedCount})
          </button>
        </div>
      </div>

      {/* Feedbacks Grid / List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748B', fontSize: '0.9rem' }}>
          Loading customer feedback submissions...
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3.5rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          color: '#64748B',
          fontSize: '0.9rem'
        }}>
          No customer feedbacks found matching the selected filter.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredFeedbacks.map((item) => {
            const isResponded = (item.status || '').toLowerCase().includes('responded');
            return (
              <div key={item.id} className="card-rounded" style={{
                padding: '1.35rem',
                background: '#FFFFFF',
                border: isResponded ? '1px solid #E2E8F0' : '1.5px solid #FCD34D',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* Status & Rating header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        <Star key={s} size={15} fill={s <= (item.rating || 5) ? '#F59E0B' : '#E2E8F0'} color={s <= (item.rating || 5) ? '#F59E0B' : '#CBD5E1'} />
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#0F4C81', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                      {item.customerName ? item.customerName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A' }}>
                        {item.customerName || 'Customer'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {item.customerEmail || 'customer@packflow.com'}
                      </div>
                    </div>
                  </div>

                  {/* Subject & Message */}
                  <div>
                    <h4 style={{ fontSize: '0.975rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.35rem 0' }}>
                      {item.subject}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.55 }}>
                      "{item.message}"
                    </p>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Submitted: {item.createdAt ? item.createdAt.replace('T', ' ').substring(0, 16) : ''}
                  </div>

                  {/* Admin Response view if present */}
                  {isResponded && item.adminResponse && (
                    <div style={{
                      padding: '0.85rem',
                      borderRadius: '0.65rem',
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #6EE7B7',
                      fontSize: '0.825rem',
                      color: '#047857'
                    }}>
                      <div style={{ fontWeight: '800', color: '#065F46', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={13} />
                        <span>Admin Response ({item.respondedBy || 'Admin'}):</span>
                      </div>
                      "{item.adminResponse}"
                    </div>
                  )}
                </div>

                {/* Action Buttons: Respond & Delete */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => handleOpenRespond(item)}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: 'none',
                      backgroundColor: isResponded ? '#F1F5F9' : '#0F4C81',
                      color: isResponded ? '#334155' : '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: '0.2s ease'
                    }}
                  >
                    <Send size={15} />
                    <span>{isResponded ? 'Update Response' : 'Respond'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteFeedback(item)}
                    title="Delete feedback entry"
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      transition: '0.2s ease'
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      {selectedFeedback && (
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
            maxWidth: '540px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={22} style={{ color: '#0F4C81' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Respond to Customer Feedback
                </h3>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Original Feedback Brief */}
            <div style={{ padding: '0.85rem 1rem', borderRadius: '0.65rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: '800', color: '#0F172A' }}>
                {selectedFeedback.customerName} ({selectedFeedback.customerEmail})
              </div>
              <div style={{ fontWeight: '700', color: '#334155', marginTop: '0.2rem' }}>
                Subject: {selectedFeedback.subject}
              </div>
              <div style={{ color: '#475569', marginTop: '0.25rem', fontStyle: 'italic' }}>
                "{selectedFeedback.message}"
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSendResponse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Official Admin Response Message *
                </label>
                <textarea
                  rows={5}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your official response to address the customer's review or inquiry..."
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
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
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Send size={16} />
                  <span>{submitting ? 'Sending...' : 'Send Response'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
