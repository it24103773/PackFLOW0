import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { submitSupplierInquiry } from '../services/api';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    category: 'Raw Materials & Inks',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await submitSupplierInquiry({
        companyName: formData.company || formData.name,
        contactPerson: formData.name,
        email: formData.email,
        phone: formData.phone || '0705652577',
        category: formData.category,
        suppliedMaterials: [formData.category],
        inquiryMessage: formData.message
      });
      setSubmitted(true);
    } catch (err) {
      alert(err.message || 'Failed to submit supplier inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" style={{
      padding: '6rem 1.5rem',
      backgroundColor: '#FFFFFF',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
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
            <span>Outside Supplier & Client Desk</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem' }}>
            Send Us a Message & Supplier Inquiry
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748B', lineHeight: '1.6' }}>
            Interested in supplying raw packaging materials or partnering with PackFlow? Submit your inquiry below for Admin verification.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'start'
        }}>
          {/* Company Information Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card-rounded" style={{ padding: '2rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0F172A', marginBottom: '1.5rem' }}>
                Corporate Contact Info
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#EBF4FC', color: '#0F4C81', padding: '0.75rem', borderRadius: '0.85rem' }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Email Us</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A' }}>suppliers@packflow.com</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>24/7 supplier partner desk</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#FEF3C7', color: '#D97706', padding: '0.75rem', borderRadius: '0.85rem' }}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Call Us</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A' }}>0705652577</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Mon - Fri, 8:00 AM - 6:00 PM EST</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#D1FAE5', color: '#059669', padding: '0.75rem', borderRadius: '0.85rem' }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Headquarters</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A' }}>26/11 Gonamaditha Road</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Piliyandala, Sri Lanka</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card-rounded" style={{ padding: '2.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0F172A', marginBottom: '1.5rem' }}>
              Send Us a Message
            </h3>

            {submitted ? (
              <div style={{
                background: '#D1FAE5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                padding: '1.5rem',
                borderRadius: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle2 size={36} />
                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Inquiry Submitted Successfully!</div>
                <p style={{ fontSize: '0.9rem' }}>
                  Your supplier inquiry has been sent to the Administration Supplier Directory. Upon verification, Admin will register your profile.
                </p>
                <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', company: '', category: 'Raw Materials & Inks', message: '' }); }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                      Business Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="john@supplier.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Apex Board & Inks Ltd"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                      Contact Mobile / Phone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+1 (555) 234-5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                    Supply Category / Materials Offered
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Raw Materials & Inks">Raw Materials & Inks</option>
                    <option value="Corrugated Substrates">Corrugated Sheets & Substrates</option>
                    <option value="Coatings & Laminations">Coatings & Thermal Laminations</option>
                    <option value="Printing & Flexo Inks">Printing & Flexo Inks</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                    Inquiry Message / Material Capabilities *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details about your raw material supplies, unit pricing & delivery capabilities..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <span>{loading ? 'Submitting Inquiry...' : 'Submit Inquiry to Admin'}</span>
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
