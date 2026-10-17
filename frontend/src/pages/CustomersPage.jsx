import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  fetchPendingCustomers,
  fetchCustomerRecords,
  fetchRejectedCustomers,
  approveAndRegisterCustomer,
  rejectCustomerRequest
} from '../services/api';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Package,
  ArrowRight
} from 'lucide-react';

export default function CustomersPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('system administrator');

  // Sub-sidebar Navigation Tab State inside Administrator Customer Module
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'records', 'rejected'

  const [pendingList, setPendingList] = useState([]);
  const [recordsList, setRecordsList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search Query for Customer Records
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection Modal State
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Order requirement specs exceed active manufacturing capabilities');
  const [actionLoading, setActionLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadAllData();
  }, [searchQuery]);

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [pending, records, rejected] = await Promise.all([
        fetchPendingCustomers(token),
        fetchCustomerRecords(token, searchQuery),
        fetchRejectedCustomers(token)
      ]);
      setPendingList(pending);
      setRecordsList(records);
      setRejectedList(rejected);
    } catch (e) {
      console.error('Error loading customer directory data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (customer) => {
    if (!window.confirm(`Register customer "${customer.fullName}" into Customer Records & transfer spec to 1. Customer Packaging Specifications Review Table?`)) return;
    try {
      setActionLoading(true);
      await approveAndRegisterCustomer(customer.id, token);
      showNotification(`Customer "${customer.fullName}" registered! Specification sent to 1. Customer Packaging Specifications Review Table.`);
      loadAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingUser) return;
    try {
      setActionLoading(true);
      await rejectCustomerRequest(rejectingUser.id, rejectionReason, token);
      showNotification(`Customer request for "${rejectingUser.fullName}" rejected, moved to Rejected Customers table, & logged out.`);
      setRejectingUser(null);
      loadAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Administrator Header */}
        <div className="card-rounded" style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A8A 100%)',
          color: '#FFFFFF',
          borderRadius: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.3rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              <ShieldCheck size={16} style={{ color: '#F59E0B' }} />
              <span>Administrator Customer Directory & Order Verification</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>
              Customer Management & Registration Center
            </h1>
          </div>
        </div>

        {toastMsg && (
          <div style={{ padding: '0.85rem 1.25rem', borderRadius: '0.75rem', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* --- MAIN ADMINISTRATOR CONTENT WITH DEDICATED SIDEBAR --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Administrator Side Bar */}
          <aside className="card-rounded" style={{
            background: '#FFFFFF',
            borderRadius: '1rem',
            border: '1px solid #E2E8F0',
            padding: '1.25rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.05em' }}>
              Admin Navigation
            </div>

            <button
              onClick={() => setActiveTab('pending')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.925rem',
                fontWeight: activeTab === 'pending' ? '700' : '600',
                color: activeTab === 'pending' ? '#0F4C81' : '#475569',
                backgroundColor: activeTab === 'pending' ? '#EBF4FC' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: '0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={18} style={{ color: activeTab === 'pending' ? '#F59E0B' : '#94A3B8' }} />
                <span>Pending Requests</span>
              </div>
              {pendingList.length > 0 && (
                <span style={{ backgroundColor: '#F59E0B', color: '#0F172A', fontSize: '0.75rem', fontWeight: '800', padding: '0.15rem 0.55rem', borderRadius: '99px' }}>
                  {pendingList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('records')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.925rem',
                fontWeight: activeTab === 'records' ? '700' : '600',
                color: activeTab === 'records' ? '#0F4C81' : '#475569',
                backgroundColor: activeTab === 'records' ? '#EBF4FC' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: '0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Users size={18} style={{ color: activeTab === 'records' ? '#0F4C81' : '#94A3B8' }} />
                <span>Customer Records</span>
              </div>
              <span style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.55rem', borderRadius: '99px' }}>
                {recordsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.925rem',
                fontWeight: activeTab === 'rejected' ? '700' : '600',
                color: activeTab === 'rejected' ? '#DC2626' : '#475569',
                backgroundColor: activeTab === 'rejected' ? '#FEE2E2' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: '0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <UserX size={18} style={{ color: activeTab === 'rejected' ? '#DC2626' : '#94A3B8' }} />
                <span>Rejected Customers</span>
              </div>
              {rejectedList.length > 0 && (
                <span style={{ backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.55rem', borderRadius: '99px' }}>
                  {rejectedList.length}
                </span>
              )}
            </button>
          </aside>

          {/* Right Main Content Area */}
          <main className="card-rounded" style={{ background: '#FFFFFF', borderRadius: '1rem', border: '1px solid #E2E8F0', padding: '1.75rem' }}>
            
            {/* TAB 1: PENDING CUSTOMER REGISTRATIONS & ORDER REQUIREMENTS */}
            {activeTab === 'pending' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={20} style={{ color: '#F59E0B' }} />
                      <span>Pending Customer Registrations ({pendingList.length})</span>
                    </h3>
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading pending customer requests...</div>
                ) : pendingList.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                    <UserCheck size={42} style={{ color: '#94A3B8', marginBottom: '0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>No pending customer registration requests</h4>
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>All new customer registrations & requirements have been processed by administration.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {pendingList.map((cust) => {
                      const order = cust.latestOrder;
                      return (
                        <div key={cust.id} style={{ border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.5rem', backgroundColor: '#F8FAFC' }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.25rem 0.65rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                                Status: PENDING ADMIN REGISTRATION
                              </div>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>{cust.fullName}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.35rem', fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={15} style={{ color: '#0F4C81' }} /> {cust.email}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={15} style={{ color: '#059669' }} /> {cust.mobileNumber}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={15} style={{ color: '#64748B' }} /> Registered: {cust.registrationDate ? cust.registrationDate.substring(0, 10) : 'Today'}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.65rem' }}>
                              <button
                                onClick={() => handleApprove(cust)}
                                disabled={actionLoading}
                                style={{ padding: '0.65rem 1.15rem', borderRadius: '0.65rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)' }}
                              >
                                <UserCheck size={16} /> Register & Approve Customer
                              </button>
                              <button
                                onClick={() => setRejectingUser(cust)}
                                disabled={actionLoading}
                                style={{ padding: '0.65rem 1.15rem', borderRadius: '0.65rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                              >
                                <UserX size={16} /> Reject Customer
                              </button>
                            </div>
                          </div>

                          {/* Customer Order Requirement Overview */}
                          {order ? (
                            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.85rem', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                              <div style={{ fontWeight: '800', color: '#0F4C81', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FileText size={16} /> Submitted Packaging Specification (Order #{order.orderNumber}):
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', fontSize: '0.85rem' }}>
                                <div>
                                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Packaging Type</span>
                                  <strong style={{ color: '#0F172A' }}>{order.packagingType}</strong>
                                </div>
                                <div>
                                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Dimensions</span>
                                  <strong style={{ color: '#0F172A' }}>{order.dimensions}</strong>
                                </div>
                                <div>
                                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Order Quantity</span>
                                  <strong style={{ color: '#059669' }}>{order.quantity?.toLocaleString()} units</strong>
                                </div>
                                <div>
                                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Print Finish</span>
                                  <strong style={{ color: '#0F172A' }}>{order.printFinish || 'Standard'}</strong>
                                </div>
                              </div>
                              {order.notes && (
                                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                                  <strong>Requirement Notes:</strong> {order.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>
                              No initial order specs attached during registration. Standard customer account pending approval.
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REGISTERED CUSTOMER RECORDS (WITH SEARCH BAR) */}
            {activeTab === 'records' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={20} style={{ color: '#0F4C81' }} />
                      <span>Customer Records Table ({recordsList.length})</span>
                    </h3>
                  </div>

                  {/* Customer Search Bar */}
                  <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search customer records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                        borderRadius: '0.65rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading customer records...</div>
                ) : recordsList.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                    <Users size={42} style={{ color: '#94A3B8', marginBottom: '0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>No customer records found</h4>
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>Try clearing the search query or registering pending customers.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#475569' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Customer ID</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Full Name</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Contact Mobile No</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Registration Date</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recordsList.map((rec) => (
                          <tr key={rec.id} style={{ borderBottom: '1px solid #F1F5F9', transition: '0.15s ease' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F4C81' }}>#CUST-00{rec.id}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F172A' }}>{rec.fullName}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{rec.email}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#059669' }}>{rec.mobileNumber || '+1 (555) 234-5678'}</td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.825rem', color: '#64748B' }}>{rec.registrationDate ? rec.registrationDate.substring(0, 10) : 'Registered'}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.775rem', fontWeight: '800' }}>
                                REGISTERED
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>
                              {rec.totalOrders || 1}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: REJECTED CUSTOMERS TABLE */}
            {activeTab === 'rejected' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserX size={20} style={{ color: '#DC2626' }} />
                      <span>Rejected Customers Table ({rejectedList.length})</span>
                    </h3>
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading rejected customers...</div>
                ) : rejectedList.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                    <CheckCircle2 size={42} style={{ color: '#10B981', marginBottom: '0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>No rejected customer records</h4>
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>All customer registrations & orders have been approved.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#FEE2E2', borderBottom: '2px solid #FCA5A5', color: '#991B1B' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Customer ID</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Full Name</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Contact Mobile No</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Rejection Reason</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Session Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedList.map((rej) => (
                          <tr key={rej.id} style={{ borderBottom: '1px solid #FEE2E2', backgroundColor: '#FFF5F5' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#991B1B' }}>#REJ-00{rej.id}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F172A' }}>{rej.fullName}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{rej.email}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>{rej.mobileNumber || 'N/A'}</td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#991B1B', fontWeight: '600' }}>
                              {rej.rejectionReason}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.775rem', fontWeight: '800' }}>
                                LOGGED OUT (ACCESS BLOCKED)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>

        {/* --- REJECTION REASON MODAL --- */}
        {rejectingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '500px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserX size={22} /> Reject Customer Request
                </h3>
                <button onClick={() => setRejectingUser(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={22} />
                </button>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem' }}>
                Rejecting customer <strong>{rejectingUser.fullName}</strong> will move them to the <strong>Rejected Customers</strong> table and immediately <strong>log them out of the system</strong>.
              </p>

              <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Rejection Reason *
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.6rem', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setRejectingUser(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700' }}>
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection & Logout Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
