import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  fetchPendingSuppliers,
  fetchSupplierRecords,
  fetchRejectedSuppliers,
  fetchSupplierActivities,
  approveSupplierInquiry,
  rejectSupplierInquiry,
  deleteSupplierRecord,
  fetchSupplierMaterialHistory,
  addSupplierMaterialHistory,
  deleteSupplierMaterialHistory
} from '../services/api';
import {
  Truck,
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
  ShieldCheck,
  Package,
  Building2,
  Star,
  Trash2,
  Activity,
  TrendingUp,
  BarChart3,
  Eye,
  Info,
  Layers,
  AlertCircle,
  Plus,
  Boxes,
  Archive,
  DollarSign
} from 'lucide-react';

export default function SuppliersPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('system administrator');

  // Sub-sidebar Navigation Tab State inside Administrator Supplier Directory
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'records', 'activity', 'material-history', 'rejected'

  const [pendingList, setPendingList] = useState([]);
  const [recordsList, setRecordsList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);
  const [activityData, setActivityData] = useState(null);
  const [selectedActivitySupplier, setSelectedActivitySupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  // Supplier Previous Material History State
  const [materialHistoryList, setMaterialHistoryList] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySupplierFilter, setHistorySupplierFilter] = useState('');
  const [showAddHistoryModal, setShowAddHistoryModal] = useState(false);
  const [deletingHistoryRecord, setDeletingHistoryRecord] = useState(null);
  const [historyForm, setHistoryForm] = useState({
    supplierId: '',
    supplierName: 'PrintCraft Inks Ltd',
    materialName: '',
    category: 'Paper Substrates',
    quantity: 1000,
    unit: 'Sheets',
    unitPrice: 150.00,
    supplyDate: new Date().toISOString().split('T')[0],
    batchNumber: `MAT-SUP-2026-${Math.floor(100 + Math.random() * 900)}`,
    qualityStatus: 'Passed QA Inspection',
    notes: ''
  });

  // Search Query for Supplier Records
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection & Deletion Modal State
  const [rejectingSupplier, setRejectingSupplier] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Supplier raw material qualifications do not meet active packaging standards');
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadAllData();
  }, [searchQuery, historySearchQuery, historySupplierFilter]);

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [pending, records, rejected, activity, matHistory] = await Promise.all([
        fetchPendingSuppliers(token),
        fetchSupplierRecords(token, searchQuery),
        fetchRejectedSuppliers(token),
        fetchSupplierActivities(token),
        fetchSupplierMaterialHistory(historySupplierFilter || null, token)
      ]);
      setPendingList(pending);
      setRecordsList(records);
      setRejectedList(rejected);
      setActivityData(activity);
      setMaterialHistoryList(matHistory || []);
    } catch (e) {
      console.error('Error loading supplier directory data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHistorySubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        ...historyForm,
        quantity: Number(historyForm.quantity),
        unitPrice: Number(historyForm.unitPrice),
        totalCost: Number(historyForm.quantity) * Number(historyForm.unitPrice)
      };
      await addSupplierMaterialHistory(payload, token);
      showNotification(`Added previous material history record "${historyForm.materialName}" for ${historyForm.supplierName}!`);
      setShowAddHistoryModal(false);
      loadAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHistoryConfirm = async () => {
    if (!deletingHistoryRecord) return;
    try {
      setActionLoading(true);
      await deleteSupplierMaterialHistory(deletingHistoryRecord.id, token);
      showNotification(`Deleted material history record "${deletingHistoryRecord.materialName}".`);
      setDeletingHistoryRecord(null);
      loadAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (supplier) => {
    const targetId = supplier.id != null ? supplier.id : supplier.email;
    if (!window.confirm(`Register and approve supplier "${supplier.companyName}" into Supplier Records?`)) return;
    try {
      setActionLoading(true);
      await approveSupplierInquiry(targetId, token);
      showNotification(`Supplier "${supplier.companyName}" approved and registered into Supplier Records!`);
      loadAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingSupplier) return;
    const targetId = rejectingSupplier.id != null ? rejectingSupplier.id : rejectingSupplier.email;
    try {
      setActionLoading(true);
      await rejectSupplierInquiry(targetId, rejectionReason, token);
      showNotification(`Supplier inquiry for "${rejectingSupplier.companyName}" rejected and moved to Rejected Suppliers table.`);
      setRejectingSupplier(null);
      loadAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;
    const targetId = deletingSupplier.id != null ? deletingSupplier.id : deletingSupplier.email;
    try {
      setActionLoading(true);
      await deleteSupplierRecord(targetId, token);
      showNotification(`Supplier record "${deletingSupplier.companyName}" deleted successfully from system!`);
      setDeletingSupplier(null);
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
              <span>Administrator Supplier Directory & Vendor Inquiries</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>
              Supplier Records & Verification Center
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
              Supplier Navigation
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
                <span>Pending Inquiries</span>
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
                <Truck size={18} style={{ color: activeTab === 'records' ? '#0F4C81' : '#94A3B8' }} />
                <span>Supplier Records</span>
              </div>
              <span style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.55rem', borderRadius: '99px' }}>
                {recordsList.length}
              </span>
            </button>

            {/* NEW: Supplier Activity Info added directly under Supplier Records */}
            <button
              onClick={() => setActiveTab('activity')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.925rem',
                fontWeight: activeTab === 'activity' ? '700' : '600',
                color: activeTab === 'activity' ? '#0F4C81' : '#475569',
                backgroundColor: activeTab === 'activity' ? '#EBF4FC' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: '0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Activity size={18} style={{ color: activeTab === 'activity' ? '#0F4C81' : '#94A3B8' }} />
                <span>Supplier Activity Info</span>
              </div>
              <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.55rem', borderRadius: '99px' }}>
                {activityData?.supplierActivities?.length || 0}
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
                <span>Rejected Suppliers</span>
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
            
            {/* TAB 1: PENDING SUPPLIER INQUIRIES */}
            {activeTab === 'pending' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={20} style={{ color: '#F59E0B' }} />
                      <span>Pending Supplier Inquiries ({pendingList.length})</span>
                    </h3>
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading pending supplier inquiries...</div>
                ) : pendingList.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                    <UserCheck size={42} style={{ color: '#94A3B8', marginBottom: '0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>No pending supplier inquiries</h4>
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>All submitted outside supplier inquiries have been verified and processed by administration.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {pendingList.map((supp) => (
                      <div key={supp.id || supp.email} style={{ border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.5rem', backgroundColor: '#F8FAFC' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.25rem 0.65rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                              Status: PENDING ADMIN APPROVAL
                            </div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>{supp.companyName}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.35rem', fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Building2 size={15} style={{ color: '#0F4C81' }} /> Contact: {supp.contactPerson}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={15} style={{ color: '#0F4C81' }} /> {supp.email}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={15} style={{ color: '#059669' }} /> {supp.phone}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '0.65rem' }}>
                            <button
                              onClick={() => handleApprove(supp)}
                              disabled={actionLoading}
                              style={{ padding: '0.65rem 1.15rem', borderRadius: '0.65rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)' }}
                            >
                              <UserCheck size={16} /> Approve & Register Supplier
                            </button>
                            <button
                              onClick={() => setRejectingSupplier(supp)}
                              disabled={actionLoading}
                              style={{ padding: '0.65rem 1.15rem', borderRadius: '0.65rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <UserX size={16} /> Reject Supplier
                            </button>
                          </div>
                        </div>

                        {/* Supplier Inquiry Message Overview */}
                        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.85rem', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontWeight: '800', color: '#0F4C81', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FileText size={16} /> Outside Inquiry Details & Supplied Materials:
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.5rem' }}>
                            <strong>Supply Category:</strong> {supp.category} &bull; <strong>Materials Offered:</strong> {Array.isArray(supp.suppliedMaterials) ? supp.suppliedMaterials.join(', ') : supp.suppliedMaterials}
                          </div>
                          {supp.inquiryMessage && (
                            <div style={{ fontSize: '0.825rem', color: '#475569', backgroundColor: '#F0F9FF', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #BAE6FD' }}>
                              <strong>Message:</strong> &ldquo;{supp.inquiryMessage}&rdquo;
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REGISTERED SUPPLIER RECORDS (WITH SEARCH BAR) */}
            {activeTab === 'records' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Truck size={20} style={{ color: '#0F4C81' }} />
                      <span>Supplier Records Table ({recordsList.length})</span>
                    </h3>
                  </div>

                  {/* Supplier Search Bar */}
                  <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search supplier records by Company, Contact, Email, Category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                        borderRadius: '0.65rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading supplier records...</div>
                ) : recordsList.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                    <Truck size={42} style={{ color: '#94A3B8', marginBottom: '0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>No supplier records found</h4>
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>Try clearing the search query or approving pending supplier inquiries.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#475569' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Supplier ID</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Company Name</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Contact Person</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Email & Mobile</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Category & Materials</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Availability</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recordsList.map((rec) => (
                          <tr key={rec.id || rec.email} style={{ borderBottom: '1px solid #F1F5F9', transition: '0.15s ease' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F4C81' }}>#SUPP-00{rec.id || 1}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F172A' }}>{rec.companyName}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: '600' }}>{rec.contactPerson}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ color: '#0F172A' }}>{rec.email}</div>
                              <div style={{ fontSize: '0.775rem', color: '#059669', fontWeight: '600' }}>{rec.phone}</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: '700', color: '#D97706' }}>{rec.category}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                {Array.isArray(rec.suppliedMaterials) ? rec.suppliedMaterials.join(', ') : rec.suppliedMaterials}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', backgroundColor: rec.availabilityStatus === 'In Stock' ? '#D1FAE5' : '#FEF3C7', color: rec.availabilityStatus === 'In Stock' ? '#059669' : '#D97706', fontSize: '0.75rem', fontWeight: '700' }}>
                                {rec.availabilityStatus || 'Available'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.775rem', fontWeight: '800' }}>
                                REGISTERED
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              <button
                                onClick={() => setDeletingSupplier(rec)}
                                disabled={actionLoading}
                                title="Delete Supplier Record"
                                style={{
                                  padding: '0.45rem 0.75rem',
                                  borderRadius: '0.5rem',
                                  backgroundColor: '#FEE2E2',
                                  color: '#DC2626',
                                  border: '1px solid #FCA5A5',
                                  fontWeight: '700',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  transition: '0.15s ease'
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Delete Record</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SUPPLIER ACTIVITY INFO & RELATIONSHIP MONITOR */}
            {activeTab === 'activity' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={22} style={{ color: '#0F4C81' }} />
                      <span>Supplier Activity Information & Relationship Monitor</span>
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                      Track supplier restock frequencies, material catalog offerings, lead times, and relationship performance logs.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading supplier activity metrics...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* KPI Metric Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      
                      <div style={{ padding: '1.15rem', borderRadius: '0.85rem', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0369A1', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Active Suppliers</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A' }}>{activityData?.summary?.totalRegisteredSuppliers || recordsList.length}</div>
                        <div style={{ fontSize: '0.775rem', color: '#0284C7', marginTop: '0.25rem' }}>Registered & Verified Vendors</div>
                      </div>

                      <div style={{ padding: '1.15rem', borderRadius: '0.85rem', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#047857', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Stock Restocks Completed</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A' }}>{activityData?.summary?.totalRestocksCompleted || 0}</div>
                        <div style={{ fontSize: '0.775rem', color: '#059669', marginTop: '0.25rem' }}>Supplied Raw Materials</div>
                      </div>

                      <div style={{ padding: '1.15rem', borderRadius: '0.85rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#B45309', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Material Offerings</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A' }}>{activityData?.summary?.activeMaterialsSupplied || 0}</div>
                        <div style={{ fontSize: '0.775rem', color: '#D97706', marginTop: '0.25rem' }}>Active Supply Categories</div>
                      </div>

                      <div style={{ padding: '1.15rem', borderRadius: '0.85rem', backgroundColor: '#F3E8FF', border: '1px solid #DDD6FE' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6B21A8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Relationship Score</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A' }}>{activityData?.summary?.systemRelationshipIndex || '98.5%'}</div>
                        <div style={{ fontSize: '0.775rem', color: '#7E22CE', marginTop: '0.25rem' }}>Avg Reliability & On-Time Rate</div>
                      </div>

                    </div>

                    {/* Supplier Activity & Performance Table */}
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BarChart3 size={18} style={{ color: '#0F4C81' }} />
                        <span>Supplier Performance & Activity Summary</span>
                      </h4>

                      {(!activityData?.supplierActivities || activityData.supplierActivities.length === 0) ? (
                        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', color: '#64748B' }}>
                          No supplier activity records recorded yet.
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #CBD5E1', color: '#475569' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Supplier Name</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Category & Contact</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Restocks Completed</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Material Offerings</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Lead Time</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Rating / Reliability</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activityData.supplierActivities.map((sa) => (
                                <tr key={sa.id || sa.email} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    <div style={{ fontWeight: '700', color: '#0F172A' }}>{sa.companyName}</div>
                                    <div style={{ fontSize: '0.775rem', color: '#0F4C81', fontWeight: '600' }}>#SUPP-00{sa.id || 1}</div>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    <div style={{ fontWeight: '600', color: '#334155' }}>{sa.category}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{sa.email}</div>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: '0.8rem', fontWeight: '800', padding: '0.25rem 0.65rem', borderRadius: '99px' }}>
                                      {sa.totalRestocksCompleted} Restocks
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                                    {Array.isArray(sa.suppliedMaterials) ? sa.suppliedMaterials.join(', ') : sa.suppliedMaterials}
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#059669' }}>
                                    {sa.averageLeadTime}
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#D97706', fontWeight: '700' }}>
                                      <Star size={14} fill="#F59E0B" style={{ color: '#F59E0B' }} />
                                      <span>{sa.ratingScore} / 5.0</span>
                                    </div>
                                    <div style={{ fontSize: '0.725rem', color: '#166534', fontWeight: '700' }}>{sa.reliabilityGrade}</div>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <button
                                      onClick={() => setSelectedActivitySupplier(sa)}
                                      style={{
                                        padding: '0.45rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        backgroundColor: '#EBF4FC',
                                        color: '#0F4C81',
                                        border: '1px solid #BAE6FD',
                                        fontWeight: '700',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                      }}
                                    >
                                      <Eye size={14} />
                                      <span>View Activity Trace</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Activity Log Timeline */}
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={18} style={{ color: '#0F4C81' }} />
                        <span>Recent Supplier Audit & Stock Activity Logs</span>
                      </h4>

                      {(!activityData?.activityLogs || activityData.activityLogs.length === 0) ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', color: '#64748B' }}>
                          No recent supplier activity logs recorded.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {activityData.activityLogs.slice(0, 8).map((log, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '0.85rem 1rem', borderRadius: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0F4C81', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Activity size={16} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>{log.supplierName}</span>
                                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600' }}>{log.timestamp}</span>
                                </div>
                                <p style={{ fontSize: '0.825rem', color: '#334155', margin: '0.2rem 0 0 0' }}>{log.activityDescription}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB: SUPPLIER PREVIOUS MATERIAL HISTORY TABLE */}
            {activeTab === 'material-history' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Boxes size={20} style={{ color: '#059669' }} />
                      <span>Supplier Previous Material History Table ({materialHistoryList.length})</span>
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                      Historical record of raw materials, substrates, inks, adhesives, and coatings delivered by registered suppliers.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddHistoryModal(true)}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: '0.65rem',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    <Plus size={16} /> Record Material Supply
                  </button>
                </div>

                {/* Summary Stat Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #DCFCE7' }}>
                    <div style={{ fontSize: '0.775rem', fontWeight: '700', color: '#166534' }}>Total Historic Deliveries</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669', marginTop: '0.2rem' }}>{materialHistoryList.length} Batches</div>
                  </div>
                  <div style={{ backgroundColor: '#FEF3C7', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '0.775rem', fontWeight: '700', color: '#92400E' }}>Total Material Spend</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#B45309', marginTop: '0.2rem' }}>
                      LKR {materialHistoryList.reduce((sum, h) => sum + (Number(h.totalCost) || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#EFF6FF', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '0.775rem', fontWeight: '700', color: '#1E40AF' }}>Suppliers in History</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1D4ED8', marginTop: '0.2rem' }}>
                      {new Set(materialHistoryList.map(h => h.supplierName)).size} Suppliers
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#ECFDF5', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: '0.775rem', fontWeight: '700', color: '#065F46' }}>QA Pass Rate</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#047857', marginTop: '0.2rem' }}>100.0% Verified</div>
                  </div>
                </div>

                {/* Filter and Search controls */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search material name, supplier, batch #, category..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <select
                    value={historySupplierFilter}
                    onChange={(e) => setHistorySupplierFilter(e.target.value)}
                    style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: '600', color: '#334155' }}
                  >
                    <option value="">All Suppliers</option>
                    {recordsList.map(s => (
                      <option key={s.id || s.companyName} value={s.companyName}>{s.companyName}</option>
                    ))}
                  </select>
                </div>

                {/* History Table */}
                {loading ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading previous material history records...</div>
                ) : materialHistoryList.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                    <Archive size={42} style={{ color: '#94A3B8', marginBottom: '0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>No material supply history records found</h4>
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>Click "Record Material Supply" to enter past material deliveries from suppliers.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#475569', fontWeight: '700' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Batch / Ref #</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Supplier Name</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Material & Category</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Quantity</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Unit Price</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Total Cost (LKR)</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Supply Date</th>
                          <th style={{ padding: '0.75rem 1rem' }}>QA Status</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialHistoryList.map((hist) => (
                          <tr key={hist.id} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '800', color: '#0F4C81' }}>
                              {hist.batchNumber || `MAT-HIST-00${hist.id}`}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F172A' }}>
                              {hist.supplierName}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: '700', color: '#334155' }}>{hist.materialName}</div>
                              <span style={{ fontSize: '0.725rem', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: '600', display: 'inline-block', marginTop: '0.2rem' }}>
                                {hist.category || 'Raw Material'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#059669' }}>
                              {hist.quantity?.toLocaleString()} {hist.unit || 'Units'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                              LKR {hist.unitPrice?.toFixed(2)}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '800', color: '#B45309' }}>
                              LKR {hist.totalCost?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                              {hist.supplyDate}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ padding: '0.2rem 0.55rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.75rem', fontWeight: '700' }}>
                                {hist.qualityStatus || 'Passed QA'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              <button
                                onClick={() => setDeletingHistoryRecord(hist)}
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '0.45rem',
                                  backgroundColor: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FCA5A5',
                                  fontWeight: '700',
                                  fontSize: '0.775rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: REJECTED SUPPLIERS TABLE */}
            {activeTab === 'rejected' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserX size={20} style={{ color: '#DC2626' }} />
                      <span>Rejected Suppliers Table ({rejectedList.length})</span>
                    </h3>
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading rejected suppliers...</div>
                ) : rejectedList.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                    <CheckCircle2 size={42} style={{ color: '#10B981', marginBottom: '0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>No rejected supplier records</h4>
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>All supplier inquiries have been approved and registered.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#FEE2E2', borderBottom: '2px solid #FCA5A5', color: '#991B1B' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Supplier ID</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Company Name</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Contact Person</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Email & Mobile</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Rejection Reason</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Access Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedList.map((rej) => (
                          <tr key={rej.id || rej.email} style={{ borderBottom: '1px solid #FEE2E2', backgroundColor: '#FFF5F5' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#991B1B' }}>#REJ-SUPP-00{rej.id || 1}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F172A' }}>{rej.companyName}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{rej.contactPerson}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div>{rej.email}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{rej.phone}</div>
                            </td>
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

        {/* --- SUPPLIER ACTIVITY TRACE MODAL --- */}
        {selectedActivitySupplier && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '600px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F4C81', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={22} />
                    <span>Supplier Activity Trace: {selectedActivitySupplier.companyName}</span>
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                    Contact: {selectedActivitySupplier.contactPerson} ({selectedActivitySupplier.email})
                  </div>
                </div>
                <button onClick={() => setSelectedActivitySupplier(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Supply Category</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', marginTop: '0.25rem' }}>{selectedActivitySupplier.category}</div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Average Lead Time</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#059669', marginTop: '0.25rem' }}>{selectedActivitySupplier.averageLeadTime}</div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Completed Restocks</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0369A1', marginTop: '0.25rem' }}>{selectedActivitySupplier.totalRestocksCompleted} Orders</div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Reliability Score</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#D97706', marginTop: '0.25rem' }}>{selectedActivitySupplier.ratingScore} / 5.0 ({selectedActivitySupplier.reliabilityGrade})</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#F1F5F9', padding: '1rem', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F4C81', marginBottom: '0.35rem' }}>Materials Supplied Catalog</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    {Array.isArray(selectedActivitySupplier.suppliedMaterials) ? selectedActivitySupplier.suppliedMaterials.join(', ') : selectedActivitySupplier.suppliedMaterials}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>Recent Audit Activity Traces</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: '0.8rem', color: '#065F46' }}>
                      <strong>Stock Restock:</strong> Completed delivery for packaging raw materials.
                    </div>
                    <div style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: '0.8rem', color: '#0369A1' }}>
                      <strong>Verification:</strong> Supplier quality compliance audit score verified by Administrator.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button onClick={() => setSelectedActivitySupplier(null)} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#0F4C81', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}>
                    Close Activity Trace
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* --- REJECTION REASON MODAL --- */}
        {rejectingSupplier && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '500px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserX size={22} /> Reject Supplier Request
                </h3>
                <button onClick={() => setRejectingSupplier(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={22} />
                </button>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem' }}>
                Rejecting supplier <strong>{rejectingSupplier.companyName}</strong> will move them to the <strong>Rejected Suppliers</strong> table and block system access.
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
                  <button type="button" onClick={() => setRejectingSupplier(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700' }}>
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- DELETION CONFIRMATION MODAL --- */}
        {deletingSupplier && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '500px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={22} /> Delete Supplier Record
                </h3>
                <button onClick={() => setDeletingSupplier(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={22} />
                </button>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem' }}>
                Are you sure you want to permanently delete supplier record for <strong>{deletingSupplier.companyName}</strong> ({deletingSupplier.email})? This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setDeletingSupplier(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={handleConfirmDelete} disabled={actionLoading} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                  {actionLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- RECORD PREVIOUS MATERIAL SUPPLY MODAL --- */}
        {showAddHistoryModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '600px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F4C81', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Boxes size={22} style={{ color: '#059669' }} /> Record Previous Supplier Material Supply
                </h3>
                <button onClick={() => setShowAddHistoryModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleAddHistorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Supplier Name *</label>
                    <input
                      type="text"
                      required
                      value={historyForm.supplierName}
                      onChange={(e) => setHistoryForm({ ...historyForm, supplierName: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                      placeholder="e.g. PrintCraft Inks Ltd"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Material Category *</label>
                    <select
                      value={historyForm.category}
                      onChange={(e) => setHistoryForm({ ...historyForm, category: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="Paper Substrates">Paper Substrates & Corrugated</option>
                      <option value="Printing Inks & Solvents">Printing Inks & Solvents</option>
                      <option value="Chemicals & Varnishes">Chemicals & Coatings</option>
                      <option value="Adhesives & Glues">Adhesives & Glues</option>
                      <option value="Lamination Films">Lamination Films & Foils</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Material Specification Name *</label>
                  <input
                    type="text"
                    required
                    value={historyForm.materialName}
                    onChange={(e) => setHistoryForm({ ...historyForm, materialName: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    placeholder="e.g. Kraft Paperboard 350 GSM (B-Flute)"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={historyForm.quantity}
                      onChange={(e) => setHistoryForm({ ...historyForm, quantity: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Unit *</label>
                    <select
                      value={historyForm.unit}
                      onChange={(e) => setHistoryForm({ ...historyForm, unit: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="Sheets">Sheets</option>
                      <option value="Liters">Liters</option>
                      <option value="Rolls">Rolls</option>
                      <option value="Kg">Kg</option>
                      <option value="Units">Units</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Unit Price (LKR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={historyForm.unitPrice}
                      onChange={(e) => setHistoryForm({ ...historyForm, unitPrice: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Supply / Delivery Date *</label>
                    <input
                      type="date"
                      required
                      value={historyForm.supplyDate}
                      onChange={(e) => setHistoryForm({ ...historyForm, supplyDate: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Batch / Invoice Ref #</label>
                    <input
                      type="text"
                      value={historyForm.batchNumber}
                      onChange={(e) => setHistoryForm({ ...historyForm, batchNumber: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                      placeholder="e.g. MAT-SUP-2026-104"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>QA / Quality Inspection Status</label>
                  <select
                    value={historyForm.qualityStatus}
                    onChange={(e) => setHistoryForm({ ...historyForm, qualityStatus: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Passed QA Inspection">Passed QA Inspection</option>
                    <option value="Approved Premium Grade">Approved Premium Grade</option>
                    <option value="Verified Standard Stock">Verified Standard Stock</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Notes & Technical Remarks</label>
                  <textarea
                    rows="2"
                    value={historyForm.notes}
                    onChange={(e) => setHistoryForm({ ...historyForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', outline: 'none' }}
                    placeholder="Enter special technical details, moisture levels, burst strength rating..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowAddHistoryModal(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                    {actionLoading ? 'Saving...' : 'Save Material Supply Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- DELETE MATERIAL HISTORY CONFIRMATION MODAL --- */}
        {deletingHistoryRecord && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '500px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={22} /> Delete Material History Record
                </h3>
                <button onClick={() => setDeletingHistoryRecord(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={22} />
                </button>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem' }}>
                Are you sure you want to delete material supply record for <strong>{deletingHistoryRecord.materialName}</strong> ({deletingHistoryRecord.quantity} {deletingHistoryRecord.unit}) supplied by <strong>{deletingHistoryRecord.supplierName}</strong>?
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setDeletingHistoryRecord(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={handleDeleteHistoryConfirm} disabled={actionLoading} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                  {actionLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
