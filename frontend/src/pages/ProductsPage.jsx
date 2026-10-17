import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  fetchProducts,
  fetchThirdPartyProducts,
  fetchPackagingTypes,
  updateThirdPartyProduct,
  deleteThirdPartyProduct,
  registerThirdPartyProduct,
  createProduct,
  deleteProduct,
  fetchOrders,
  placeAndAssignOrder,
  verifyOrderPayment
} from '../services/api';
import {
  Box,
  ExternalLink,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  Plus,
  Calendar,
  UserCheck,
  Clock,
  XCircle,
  PackageCheck,
  AlertCircle,
  CreditCard,
  FileText,
  ShieldAlert,
  Eye,
  Image as ImageIcon
} from 'lucide-react';

export default function ProductsPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('system administrator');

  const [products, setProducts] = useState([]);
  const [thirdPartyProducts, setThirdPartyProducts] = useState([]);
  const [packagingTypes, setPackagingTypes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('thirdParty');
  const [toastMsg, setToastMsg] = useState('');

  // Activation Bar Modal state in /products for registered orders
  const [activatingOrder, setActivatingOrder] = useState(null);
  const [activationForm, setActivationForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    assignedManager: 'Damsak (Packaging Manager)'
  });
  const [submittingActivation, setSubmittingActivation] = useState(false);

  // Payment Verification Modal state
  const [verifyingPaymentOrder, setVerifyingPaymentOrder] = useState(null);
  const [paymentRejectionReasonInput, setPaymentRejectionReasonInput] = useState('');
  const [submittingPaymentVerify, setSubmittingPaymentVerify] = useState(false);

  // Search & Filter state for registered 3rd party products & catalog
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // 3rd-Party Product Edit / Register Modal
  const [showTpModal, setShowTpModal] = useState(false);
  const [editingTp, setEditingTp] = useState(null);
  const [tpForm, setTpForm] = useState({
    productName: '',
    sku: '',
    thirdPartySku: '',
    supplierName: '',
    category: 'Corrugated Box',
    dimensions: '400 x 300 x 200 mm',
    material: 'Heavy Kraft Flute',
    unitPrice: 2.50,
    moq: 500,
    leadTimeDays: 7,
    complianceStatus: 'ISO Certified',
    status: 'Active',
    notes: ''
  });

  // Modal State for adding specific product from registered 3rd-party products
  const [showAddFromTpModal, setShowAddFromTpModal] = useState(false);
  const [selectedTpId, setSelectedTpId] = useState('');
  const [specificProductName, setSpecificProductName] = useState('');
  const [customSku, setCustomSku] = useState('');
  const [submittingAddProduct, setSubmittingAddProduct] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, tp, pt, ord] = await Promise.all([
        fetchProducts(),
        fetchThirdPartyProducts(),
        fetchPackagingTypes(),
        fetchOrders()
      ]);
      setProducts(p);
      setThirdPartyProducts(tp);
      setPackagingTypes(pt);
      setOrders(ord);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const findMatchedOrder = (tp) => {
    if (!tp || !orders || orders.length === 0) return null;
    if (tp.thirdPartySku && tp.thirdPartySku.startsWith('CUST-SUB-')) {
      const idStr = tp.thirdPartySku.replace('CUST-SUB-', '');
      const match = orders.find(o => String(o.id) === idStr);
      if (match) return match;
    }
    const matchByNotes = orders.find(o => o.orderNumber && tp.notes && tp.notes.includes(o.orderNumber));
    if (matchByNotes) return matchByNotes;

    return orders.find(o => tp.productName && tp.productName.includes(o.customerName));
  };

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenActivationModal = (order) => {
    setActivatingOrder(order);
    const today = getTodayDateStr();
    const defaultEnd = order.targetDeadline || order.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    setActivationForm({
      startDate: order.startDate && order.startDate >= today ? order.startDate : today,
      endDate: defaultEnd >= today ? defaultEnd : today,
      assignedManager: order.assignedManager || 'Damsak (Packaging Manager)'
    });
  };

  const handleActivationSubmit = async (e) => {
    e.preventDefault();
    if (!activatingOrder) return;
    try {
      setSubmittingActivation(true);
      await placeAndAssignOrder(
        activatingOrder.id,
        activationForm.startDate,
        activationForm.endDate,
        activationForm.assignedManager,
        token
      );
      showNotification(`Order #${activatingOrder.orderNumber} activated & assigned to ${activationForm.assignedManager}!`);
      setActivatingOrder(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingActivation(false);
    }
  };

  const handleVerifyPayment = async (orderId, type, status, reason) => {
    try {
      setSubmittingPaymentVerify(true);
      await verifyOrderPayment(orderId, type, status, reason, token);
      showNotification(`Order Payment ${status === 'Rejected' ? 'Rejected' : 'Verified & Accepted'}!`);
      setVerifyingPaymentOrder(null);
      setPaymentRejectionReasonInput('');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingPaymentVerify(false);
    }
  };

  const handleOpenTpAdd = () => {
    setEditingTp(null);
    setTpForm({
      productName: '',
      sku: `3PP-${Math.floor(1000 + Math.random() * 9000)}`,
      thirdPartySku: `VND-EX-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: 'Apex Paper Solutions',
      category: packagingTypes[0]?.typeName || 'Corrugated Box',
      dimensions: '400 x 300 x 200 mm',
      material: 'Heavy Kraft Flute',
      unitPrice: 2.50,
      moq: 500,
      leadTimeDays: 7,
      complianceStatus: 'ISO Certified',
      status: 'Active',
      notes: ''
    });
    setShowTpModal(true);
  };

  const handleOpenTpEdit = (tp) => {
    setEditingTp(tp);
    setTpForm({
      productName: tp.productName || '',
      sku: tp.sku || '',
      thirdPartySku: tp.thirdPartySku || '',
      supplierName: tp.supplierName || '',
      category: tp.category || 'Corrugated Box',
      dimensions: tp.dimensions || '',
      material: tp.material || '',
      unitPrice: tp.unitPrice || 0,
      moq: tp.moq || 100,
      leadTimeDays: tp.leadTimeDays || 5,
      complianceStatus: tp.complianceStatus || 'Pending Audit',
      status: tp.status || 'Active',
      notes: tp.notes || ''
    });
    setShowTpModal(true);
  };

  const handleTpSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTp) {
        await updateThirdPartyProduct(editingTp.id, tpForm, token);
        showNotification(`Updated 3rd-party product "${tpForm.productName}"`);
      } else {
        await registerThirdPartyProduct(tpForm, token);
        showNotification(`Registered 3rd-party product "${tpForm.productName}"`);
      }
      setShowTpModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTp = async (id, name) => {
    if (!window.confirm(`Remove 3rd-party product record "${name}"?`)) return;
    try {
      await deleteThirdPartyProduct(id, token);
      showNotification(`Removed 3rd-party record "${name}".`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenAddFromTpModal = () => {
    if (thirdPartyProducts.length > 0) {
      const first = thirdPartyProducts[0];
      setSelectedTpId(first.id);
      setSpecificProductName(first.productName || '');
      setCustomSku(`PROD-${first.sku || first.id}`);
    } else {
      setSelectedTpId('');
      setSpecificProductName('');
      setCustomSku('');
    }
    setShowAddFromTpModal(true);
  };

  const handleSelectTp = (id) => {
    setSelectedTpId(id);
    const tp = thirdPartyProducts.find((item) => String(item.id) === String(id));
    if (tp) {
      setSpecificProductName(tp.productName || '');
      setCustomSku(`PROD-${tp.sku || tp.id}`);
    }
  };

  const handleAddProductFromTp = async (e) => {
    e.preventDefault();
    const tp = thirdPartyProducts.find((item) => String(item.id) === String(selectedTpId));
    if (!tp && !specificProductName.trim()) {
      alert('Please select a registered 3rd-party product');
      return;
    }

    const payload = {
      name: specificProductName.trim() || tp.productName,
      sku: customSku.trim() || (tp ? `PROD-${tp.sku}` : `PROD-${Date.now().toString().slice(-4)}`),
      packagingType: tp ? tp.category : 'Corrugated Box',
      dimensions: tp ? tp.dimensions : '400 x 300 x 250 mm',
      material: tp ? tp.material : 'Kraft Double Wall B-Flute',
      status: 'Active'
    };

    try {
      setSubmittingAddProduct(true);
      await createProduct(payload, token);
      showNotification(`Product "${payload.name}" successfully added to master catalog!`);
      setShowAddFromTpModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add product to catalog');
    } finally {
      setSubmittingAddProduct(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the catalog?`)) return;
    try {
      await deleteProduct(id, token);
      showNotification(`Product "${name}" deleted from master catalog.`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
  };

  // Search Filter for Registered 3rd Party Products
  const filteredThirdPartyProducts = thirdPartyProducts.filter((tp) => {
    const matchesKeyword =
      !searchKeyword ||
      tp.productName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      tp.sku?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      tp.thirdPartySku?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      tp.supplierName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      tp.material?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      tp.dimensions?.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchesCategory = filterCategory === 'ALL' || tp.category === filterCategory;

    return matchesKeyword && matchesCategory;
  });

  // Search Filter for Product Catalog
  const filteredProducts = products.filter((p) => {
    const matchesKeyword =
      !searchKeyword ||
      p.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.material?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.dimensions?.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchesCategory = filterCategory === 'ALL' || p.packagingType === filterCategory;

    return matchesKeyword && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header (No "Add Product Master" button) */}
        <div className="card-rounded" style={{
          padding: '1.75rem',
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Box size={26} style={{ color: '#F59E0B' }} />
              <span>Products & Registered 3rd-Party Catalog</span>
            </h1>
          </div>
        </div>

        {toastMsg && (
          <div style={{ padding: '0.85rem 1.25rem', borderRadius: '0.75rem', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('thirdParty')}
            style={{
              padding: '0.65rem 1.15rem',
              borderRadius: '0.75rem',
              border: 'none',
              backgroundColor: activeTab === 'thirdParty' ? '#0F4C81' : '#F1F5F9',
              color: activeTab === 'thirdParty' ? '#FFFFFF' : '#475569',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ExternalLink size={16} /> Registered 3rd-Party Products ({thirdPartyProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('master')}
            style={{
              padding: '0.65rem 1.15rem',
              borderRadius: '0.75rem',
              border: 'none',
              backgroundColor: activeTab === 'master' ? '#0F4C81' : '#F1F5F9',
              color: activeTab === 'master' ? '#FFFFFF' : '#475569',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Box size={16} /> Packaging Master Specs Catalog ({products.length})
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ display: 'flex', gap: '1rem', backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search registered 3rd party products by Vendor SKU, Product Name, Supplier, Material..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.6rem', paddingRight: '0.75rem', paddingTop: '0.65rem', paddingBottom: '0.65rem', borderRadius: '0.6rem', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} style={{ color: '#64748B' }} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '0.65rem', borderRadius: '0.6rem', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.875rem', fontWeight: '600' }}
            >
              <option value="ALL">All Categories</option>
              {packagingTypes.map(t => (
                <option key={t.id} value={t.typeName}>{t.typeName}</option>
              ))}
            </select>
          </div>

          {searchKeyword || filterCategory !== 'ALL' ? (
            <button
              onClick={() => { setSearchKeyword(''); setFilterCategory('ALL'); }}
              style={{ padding: '0.65rem 1rem', borderRadius: '0.6rem', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#475569', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
            >
              Clear Search
            </button>
          ) : null}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading products catalog...</div>
        ) : activeTab === 'thirdParty' ? (
          /* TAB 1: REGISTERED 3RD-PARTY PRODUCTS */
          <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '0.85rem', fontWeight: '600' }}>
              Showing {filteredThirdPartyProducts.length} of {thirdPartyProducts.length} registered 3rd-party product orders
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#475569' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Internal SKU</th>
                    <th style={{ padding: '0.75rem 1rem' }}>3rd-Party Vendor SKU</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Product Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Supplier / Origin</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Dimensions & Material</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Payment Status & Slip Verification</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Order Activation Bar (PM & Dates)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>PM Status (Approved / Rejected)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredThirdPartyProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                        No registered 3rd-party products match your search keyword.
                      </td>
                    </tr>
                  ) : (
                    filteredThirdPartyProducts.map((tp) => {
                      const matchedOrder = findMatchedOrder(tp);
                      const hasCustomerDeadline = Boolean(matchedOrder && matchedOrder.targetDeadline && matchedOrder.targetDeadline.trim() !== '');
                      const isActivated = Boolean(matchedOrder && (matchedOrder.status === 'In Progress' || matchedOrder.status === 'Completed' || matchedOrder.assignedManager));
                      const isPMApproved = Boolean(matchedOrder && (matchedOrder.teamMembers || matchedOrder.assignedStaff || matchedOrder.status?.includes('PM Approved')));
                      const isPMRejected = Boolean(matchedOrder && matchedOrder.status === 'Rejected by PM');

                      return (
                        <tr key={tp.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F4C81' }}>{tp.sku}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#D97706' }}>{tp.thirdPartySku}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: '700', color: '#0F172A' }}>{tp.productName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Category: {tp.category}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: '600' }}>{tp.supplierName}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                            <div><strong>Dim:</strong> {tp.dimensions}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{tp.material}</div>
                          </td>

                          {/* PAYMENT STATUS & SLIP VERIFICATION COLUMN */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {matchedOrder ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {/* 40% Advance Payment Status */}
                                {!hasCustomerDeadline || matchedOrder.status === 'Waiting for Customer Deadline' ? (
                                  <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '0.45rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                                    <div style={{ fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <span>⏳ Waiting for 40% Advance</span>
                                    </div>
                                  </div>
                                ) : matchedOrder.paymentStatus === 'Pending Verification' ? (
                                  <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.775rem', color: '#92400E' }}>
                                    <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#D97706', marginBottom: '0.2rem' }}>
                                      <Clock size={13} /> 40% Advance Slip Uploaded
                                    </div>
                                    <div style={{ fontSize: '0.725rem', color: '#78350F', marginBottom: '0.3rem' }}>
                                      Method: <strong>{matchedOrder.paymentMethod || 'Bank Transfer'}</strong>
                                    </div>
                                    {isAdmin && (
                                      <button
                                        onClick={() => {
                                          setVerifyingPaymentOrder(matchedOrder);
                                          setPaymentRejectionReasonInput('');
                                        }}
                                        style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '0.4rem', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                      >
                                        <Eye size={13} /> Inspect Slip & Verify
                                      </button>
                                    )}
                                  </div>
                                ) : matchedOrder.paymentStatus === 'Rejected (Invalid Slip)' ? (
                                  <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.775rem', color: '#991B1B' }}>
                                    <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#DC2626' }}>
                                      <XCircle size={13} /> 40% Advance Rejected
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#7F1D1D', marginTop: '0.15rem' }}>
                                      Reason: &ldquo;{matchedOrder.paymentRejectionReason || 'Invalid slip'}&rdquo;
                                    </div>
                                    {isAdmin && (
                                      <button
                                        onClick={() => setVerifyingPaymentOrder(matchedOrder)}
                                        style={{ marginTop: '0.3rem', width: '100%', padding: '0.25rem 0.45rem', borderRadius: '0.35rem', backgroundColor: '#FFFFFF', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: '700', fontSize: '0.7rem', cursor: 'pointer' }}
                                      >
                                        Re-verify Slip
                                      </button>
                                    )}
                                  </div>
                                ) : matchedOrder.paymentStatus === 'Verified & Accepted' ? (
                                  <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', padding: '0.4rem 0.6rem', borderRadius: '0.45rem', fontSize: '0.75rem', color: '#065F46' }}>
                                    <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669' }}>
                                      <CheckCircle2 size={13} /> 40% Advance Verified
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: '0.1rem' }}>
                                      LKR {matchedOrder.advancePayment?.toLocaleString(undefined, {minimumFractionDigits: 2})} ({matchedOrder.paymentMethod || 'Visa/Bank'})
                                    </div>
                                    {matchedOrder.paymentSlipUrl && isAdmin && (
                                      <button
                                        onClick={() => setVerifyingPaymentOrder(matchedOrder)}
                                        style={{ marginTop: '0.25rem', padding: '0.2rem 0.4rem', borderRadius: '0.3rem', backgroundColor: '#FFFFFF', color: '#047857', border: '1px solid #A7F3D0', fontWeight: '700', fontSize: '0.675rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                      >
                                        <Eye size={10} /> Inspect Slip
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '0.45rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                                    <div style={{ fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <span>⏳ Waiting for 40% Advance</span>
                                    </div>
                                  </div>
                                )}

                                {/* 60% Final Payment Status */}
                                {matchedOrder.finalPaymentStatus === 'Pending Verification' ? (
                                  <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.45rem 0.6rem', borderRadius: '0.45rem', fontSize: '0.75rem', color: '#92400E' }}>
                                    <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#D97706' }}>
                                      <Clock size={13} /> 60% Final Slip Uploaded
                                    </div>
                                    {isAdmin && (
                                      <button
                                        onClick={() => setVerifyingPaymentOrder(matchedOrder)}
                                        style={{ marginTop: '0.25rem', width: '100%', padding: '0.3rem 0.45rem', borderRadius: '0.35rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.7rem', cursor: 'pointer' }}
                                      >
                                        Inspect 60% Slip & Close
                                      </button>
                                    )}
                                  </div>
                                ) : matchedOrder.status === 'Closed & Fully Paid' || matchedOrder.finalPaymentStatus === 'Verified & Accepted' ? (
                                  <div style={{ backgroundColor: '#E0F2FE', border: '1px solid #7DD3FC', padding: '0.4rem 0.6rem', borderRadius: '0.45rem', fontSize: '0.725rem', color: '#0369A1' }}>
                                    <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#0284C7' }}>
                                      <CheckCircle2 size={13} /> Closed & Fully Paid
                                    </div>
                                  </div>
                                ) : matchedOrder.finalPaymentStatus === 'Rejected (Invalid Slip)' ? (
                                  <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.45rem 0.6rem', borderRadius: '0.45rem', fontSize: '0.725rem', color: '#991B1B' }}>
                                    <div style={{ fontWeight: '800', color: '#DC2626' }}>60% Slip Rejected</div>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>No active order</span>
                            )}
                          </td>

                          {/* ORDER ACTIVATION BAR IN REGISTERED 3RD PARTY PRODUCTS TABLE */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {isActivated ? (
                              <div style={{ backgroundColor: '#E0F2FE', border: '1px solid #7DD3FC', padding: '0.65rem 0.85rem', borderRadius: '0.65rem', fontSize: '0.8rem' }}>
                                <div style={{ color: '#0284C7', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                                  <PackageCheck size={15} /> Active in Production
                                </div>
                                <div><strong>Assigned PM:</strong> {matchedOrder.assignedManager || 'Damsak (Packaging Manager)'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                                  Start: <strong>{matchedOrder.startDate || 'TBD'}</strong> &bull; End: <strong>{matchedOrder.endDate || matchedOrder.targetDeadline || 'TBD'}</strong>
                                </div>
                              </div>
                            ) : hasCustomerDeadline ? (
                              /* BLUE STATUS BAR AFTER CUSTOMER GIVES DEADLINE */
                              <div style={{ backgroundColor: '#0284C7', color: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '0.65rem', fontSize: '0.8rem', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)' }}>
                                <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                                  <Clock size={15} style={{ color: '#F59E0B' }} />
                                  <span>Customer Deadline Provided: {matchedOrder.targetDeadline}</span>
                                </div>
                                {matchedOrder.customerInstructions && (
                                  <div style={{ fontSize: '0.75rem', opacity: 0.95, marginBottom: '0.4rem', fontStyle: 'italic' }}>
                                    &ldquo;{matchedOrder.customerInstructions}&rdquo;
                                  </div>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() => handleOpenActivationModal(matchedOrder)}
                                    style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', color: '#0369A1', border: 'none', fontWeight: '800', fontSize: '0.775rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', transition: '0.15s ease' }}
                                  >
                                    <UserCheck size={14} style={{ color: '#0284C7' }} /> Assign PM & Start/End Dates
                                  </button>
                                )}
                              </div>
                            ) : (
                              /* NEUTRAL / GRAY STATUS BAR WHEN WAITING FOR CUSTOMER DEADLINE */
                              <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '0.65rem 0.85rem', borderRadius: '0.65rem', fontSize: '0.775rem', color: '#64748B' }}>
                                <div style={{ fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                  <Clock size={14} style={{ color: '#94A3B8' }} /> ⏳ Waiting for customer deadline
                                </div>
                                <div style={{ fontSize: '0.725rem', color: '#94A3B8' }}>Awaiting deadline submission from customer before PM assignment.</div>
                              </div>
                            )}
                          </td>

                          {/* PM STATUS COLUMN (APPROVED / REJECTED) */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {isPMRejected ? (
                              <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.775rem', color: '#991B1B' }}>
                                <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#DC2626' }}>
                                  <XCircle size={14} /> REJECTED BY PM
                                </div>
                                <div style={{ fontSize: '0.725rem', marginTop: '0.2rem', color: '#7F1D1D' }}>
                                  <strong>Reason:</strong> {matchedOrder.rejectionReason || 'Staff or resource shortage'}
                                </div>
                              </div>
                            ) : isPMApproved ? (
                              <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.775rem', color: '#065F46' }}>
                                <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669' }}>
                                  <CheckCircle2 size={14} /> APPROVED BY PM
                                </div>
                                <div style={{ fontSize: '0.725rem', marginTop: '0.2rem', color: '#047857' }}>
                                  <strong>Leader:</strong> {matchedOrder.teamLeader || 'Kasun'}
                                </div>
                                {matchedOrder.teamMembers && (
                                  <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: '0.15rem' }}>
                                    4 Members Assigned
                                  </div>
                                )}
                              </div>
                            ) : isActivated ? (
                              <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.775rem', color: '#92400E' }}>
                                <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#D97706' }}>
                                  <Clock size={14} /> PENDING PM REVIEW
                                </div>
                                <div style={{ fontSize: '0.725rem', marginTop: '0.2rem' }}>
                                  Awaiting 4-Member Group
                                </div>
                              </div>
                            ) : matchedOrder && matchedOrder.status === 'Waiting for Customer Deadline' ? (
                              <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                                <span style={{ fontWeight: '700', color: '#475569' }}>⏳ Waiting for Customer Deadline</span>
                              </div>
                            ) : (
                              <div style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                                <span style={{ fontWeight: '700' }}>Not Scheduled Yet</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TAB 2: PACKAGING MASTER SPECS CATALOG */
          <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>
                Showing {filteredProducts.length} of {products.length} catalog items
              </div>
              <button
                type="button"
                onClick={handleOpenAddFromTpModal}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '0.65rem',
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} /> Add Product from Registered 3rd-Party Products
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#475569' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>SKU</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Product Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Packaging Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Dimensions</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material Spec</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', width: '110px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                        No catalog items found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F4C81' }}>{p.sku}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#0F172A' }}>{p.name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '0.775rem', fontWeight: '700' }}>
                            {p.packagingType}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{p.dimensions}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{p.material}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', backgroundColor: p.status === 'Active' ? '#D1FAE5' : '#F3F4F6', color: p.status === 'Active' ? '#059669' : '#6B7280', fontSize: '0.775rem', fontWeight: '700' }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title={`Delete ${p.name}`}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.45rem',
                              border: '1px solid #FECACA',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '0.775rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3rd Party Product Modal */}
        {showTpModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '580px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem' }}>
                {editingTp ? 'Edit 3rd-Party Product Record' : 'Register 3rd-Party Product Record'}
              </h3>
              <form onSubmit={handleTpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Product Name</label>
                  <input required type="text" value={tpForm.productName} onChange={(e) => setTpForm({ ...tpForm, productName: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Internal SKU</label>
                    <input required type="text" value={tpForm.sku} onChange={(e) => setTpForm({ ...tpForm, sku: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>3rd-Party Vendor SKU</label>
                    <input required type="text" value={tpForm.thirdPartySku} onChange={(e) => setTpForm({ ...tpForm, thirdPartySku: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Supplier / Vendor Name</label>
                  <input required type="text" value={tpForm.supplierName} onChange={(e) => setTpForm({ ...tpForm, supplierName: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Category</label>
                    <select value={tpForm.category} onChange={(e) => setTpForm({ ...tpForm, category: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}>
                      {packagingTypes.map(t => (
                        <option key={t.id} value={t.typeName}>{t.typeName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Compliance Status</label>
                    <select value={tpForm.complianceStatus} onChange={(e) => setTpForm({ ...tpForm, complianceStatus: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}>
                      <option value="ISO Certified">ISO Certified</option>
                      <option value="FSC Certified">FSC Certified</option>
                      <option value="FDA Approved">FDA Approved</option>
                      <option value="Pending Audit">Pending Audit</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Dimensions</label>
                  <input type="text" value={tpForm.dimensions} onChange={(e) => setTpForm({ ...tpForm, dimensions: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Material Spec</label>
                  <input type="text" value={tpForm.material} onChange={(e) => setTpForm({ ...tpForm, material: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Unit Price ($)</label>
                    <input type="number" step="0.01" value={tpForm.unitPrice} onChange={(e) => setTpForm({ ...tpForm, unitPrice: Number(e.target.value) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>MOQ (Units)</label>
                    <input type="number" value={tpForm.moq} onChange={(e) => setTpForm({ ...tpForm, moq: Number(e.target.value) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Lead Time (Days)</label>
                    <input type="number" value={tpForm.leadTimeDays} onChange={(e) => setTpForm({ ...tpForm, leadTimeDays: Number(e.target.value) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowTpModal(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#F59E0B', color: '#0F172A' }}>
                    {editingTp ? 'Update Record' : 'Register Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Activation & PM Assignment Modal */}
        {activatingOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '520px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <PackageCheck size={26} style={{ color: '#059669' }} />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Activate Production Order #{activatingOrder.orderNumber}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Customer: {activatingOrder.customerName}</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '0.35rem' }}>
                  <strong>Target Customer Deadline:</strong>{' '}
                  <span style={{ color: '#D97706', fontWeight: '700' }}>{activatingOrder.targetDeadline || 'Not specified'}</span>
                </div>
                {activatingOrder.customerInstructions && (
                  <div style={{ marginTop: '0.35rem', fontStyle: 'italic', color: '#475569' }}>
                    &ldquo;{activatingOrder.customerInstructions}&rdquo;
                  </div>
                )}
              </div>

              <form onSubmit={handleActivationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      min={getTodayDateStr()}
                      value={activationForm.startDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setActivationForm((prev) => ({
                          ...prev,
                          startDate: newStart,
                          endDate: prev.endDate && prev.endDate < newStart ? newStart : prev.endDate
                        }));
                      }}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                      End Date (Auto-filled)
                    </label>
                    <input
                      type="date"
                      required
                      min={activationForm.startDate || getTodayDateStr()}
                      value={activationForm.endDate}
                      onChange={(e) => setActivationForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    Assign Packaging Manager
                  </label>
                  <select
                    value={activationForm.assignedManager}
                    onChange={(e) => setActivationForm({ ...activationForm, assignedManager: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.875rem', fontWeight: '600' }}
                  >
                    <option value="Damsak (Packaging Manager)">Damsak (Packaging Manager)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setActivatingOrder(null)}
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#475569', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingActivation}
                    style={{ flex: 1.5, padding: '0.65rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <UserCheck size={16} />
                    {submittingActivation ? 'Activating...' : 'Activate & Assign PM'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADMIN BANK SLIP INSPECTION & PAYMENT VERIFICATION MODAL */}
        {verifyingPaymentOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '640px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.25rem 0.65rem', borderRadius: '99px', fontSize: '0.775rem', fontWeight: '800', marginBottom: '0.35rem' }}>
                    <CreditCard size={14} /> Order Payment Verification #{verifyingPaymentOrder.orderNumber}
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    {verifyingPaymentOrder.paymentMethod?.toLowerCase().includes('visa') ? 'Payment Received & Verification Details' : 'Inspect Bank Deposit Slip & Verify Payment'}
                  </h3>
                </div>
                <button onClick={() => setVerifyingPaymentOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Customer & Pricing Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                  <div><strong>Customer:</strong> <div style={{ color: '#0F172A' }}>{verifyingPaymentOrder.customerName}</div></div>
                  <div><strong>Email:</strong> <div style={{ color: '#0F172A' }}>{verifyingPaymentOrder.customerEmail}</div></div>
                  <div><strong>Packaging Type:</strong> <div style={{ color: '#D97706', fontWeight: '700' }}>{verifyingPaymentOrder.packagingType} ({verifyingPaymentOrder.quantity?.toLocaleString()} units)</div></div>
                  <div><strong>Total Order Amount:</strong> <div style={{ color: '#059669', fontWeight: '800', fontSize: '1rem' }}>LKR {verifyingPaymentOrder.totalPrice?.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
                </div>

                {/* --- SECTION 1: 40% ADVANCE PAYMENT VERIFICATION --- */}
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', padding: '1.25rem', borderRadius: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#92400E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={18} style={{ color: '#D97706' }} />
                      <span>40% Advance Payment: LKR {verifyingPaymentOrder.advancePayment?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </h4>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.775rem', fontWeight: '800', backgroundColor: verifyingPaymentOrder.paymentStatus === 'Verified & Accepted' ? '#D1FAE5' : verifyingPaymentOrder.paymentStatus === 'Rejected (Invalid Slip)' ? '#FEE2E2' : '#FEF3C7', color: verifyingPaymentOrder.paymentStatus === 'Verified & Accepted' ? '#065F46' : verifyingPaymentOrder.paymentStatus === 'Rejected (Invalid Slip)' ? '#991B1B' : '#92400E' }}>
                      {verifyingPaymentOrder.paymentStatus || 'Pending'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    <strong>Payment Method Selected:</strong> {verifyingPaymentOrder.paymentMethod || 'Bank Transfer'}
                  </div>

                  {/* UPLOADED SLIP OR VISA PAYMENT NOTIFICATION AREA */}
                  {verifyingPaymentOrder.paymentMethod?.toLowerCase().includes('visa') || verifyingPaymentOrder.paymentSlipUrl?.includes('unsplash') || !verifyingPaymentOrder.paymentSlipUrl ? (
                    <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ backgroundColor: '#D1FAE5', color: '#059669', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', color: '#065F46', fontSize: '0.9rem' }}>
                          💳 Card Payment Received (Verified & Accepted)
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.15rem' }}>
                          Payment of <strong>LKR {verifyingPaymentOrder.advancePayment?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> was completed via 256-bit SSL encrypted Visa gateway. No bank deposit slip required.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#334155', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <ImageIcon size={16} style={{ color: '#0F4C81' }} /> Uploaded 40% Bank Deposit Slip Picture:
                      </div>
                      <img
                        src={verifyingPaymentOrder.paymentSlipUrl}
                        alt="Uploaded 40% Bank Transfer Deposit Slip"
                        style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain', borderRadius: '0.5rem', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}
                      />
                    </div>
                  )}

                  {/* ADMIN ACTION BUTTONS FOR 40% ADVANCE */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A' }}>
                      Admin Decision for 40% Advance Payment:
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleVerifyPayment(verifyingPaymentOrder.id, 'advance', 'Verified & Accepted', '')}
                        disabled={submittingPaymentVerify}
                        style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <CheckCircle2 size={16} /> Accept 40% Advance Payment
                      </button>
                    </div>

                    <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#991B1B' }}>
                        Or Reject Payment (Notify Customer):
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Reason if rejecting (e.g. Invalid bank slip reference or illegible receipt image)"
                          value={paymentRejectionReasonInput}
                          onChange={(e) => setPaymentRejectionReasonInput(e.target.value)}
                          style={{ flex: 1, minWidth: '240px', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!paymentRejectionReasonInput.trim()) {
                              alert('Please type a rejection reason for the customer before rejecting the payment.');
                              return;
                            }
                            handleVerifyPayment(verifyingPaymentOrder.id, 'advance', 'Rejected', paymentRejectionReasonInput);
                          }}
                          disabled={submittingPaymentVerify}
                          style={{ padding: '0.55rem 1rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <XCircle size={16} /> Reject Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- SECTION 2: 60% FINAL BALANCE PAYMENT VERIFICATION --- */}
                {(verifyingPaymentOrder.finalPaymentStatus || verifyingPaymentOrder.progressPercentage === 100) && (
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '1.25rem', borderRadius: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#065F46', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CreditCard size={18} style={{ color: '#059669' }} />
                        <span>60% Final Remaining Balance: LKR {verifyingPaymentOrder.remainingBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </h4>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.775rem', fontWeight: '800', backgroundColor: verifyingPaymentOrder.finalPaymentStatus === 'Verified & Accepted' || verifyingPaymentOrder.status === 'Closed & Fully Paid' ? '#D1FAE5' : '#FEF3C7', color: verifyingPaymentOrder.finalPaymentStatus === 'Verified & Accepted' ? '#065F46' : '#92400E' }}>
                        {verifyingPaymentOrder.finalPaymentStatus || 'Not Paid Yet'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      <strong>Final Payment Method Selected:</strong> {verifyingPaymentOrder.finalPaymentMethod || 'Bank Transfer'}
                    </div>

                    {/* UPLOADED FINAL SLIP OR VISA NOTIFICATION AREA */}
                    {verifyingPaymentOrder.finalPaymentMethod?.toLowerCase().includes('visa') || verifyingPaymentOrder.finalPaymentSlipUrl?.includes('unsplash') || !verifyingPaymentOrder.finalPaymentSlipUrl ? (
                      <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ backgroundColor: '#D1FAE5', color: '#059669', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#065F46', fontSize: '0.9rem' }}>
                            💳 Final 60% Balance Paid via Visa / Credit Card
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.15rem' }}>
                            Final balance payment of <strong>LKR {verifyingPaymentOrder.remainingBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> was completed via Visa gateway. Order is fully paid.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#334155', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <ImageIcon size={16} style={{ color: '#059669' }} /> Uploaded 60% Final Bank Deposit Slip Picture:
                        </div>
                        <img
                          src={verifyingPaymentOrder.finalPaymentSlipUrl}
                          alt="Uploaded 60% Final Bank Transfer Slip"
                          style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain', borderRadius: '0.5rem', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}
                        />
                      </div>
                    )}

                    {/* ADMIN ACTION BUTTONS FOR 60% FINAL PAYMENT */}
                    <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A' }}>
                        Admin Decision for 60% Final Payment:
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVerifyPayment(verifyingPaymentOrder.id, 'final', 'Verified & Accepted', '')}
                        disabled={submittingPaymentVerify}
                        style={{ padding: '0.65rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <CheckCircle2 size={16} /> Accept Final Payment & Close Order (Generate Customer PDF Receipt)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD SPECIFIC PRODUCT FROM REGISTERED 3RD-PARTY PRODUCTS */}
        {showAddFromTpModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '1.75rem 2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '580px', border: '1px solid #E2E8F0', maxHeight: '92vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ padding: '0.45rem', borderRadius: '0.6rem', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex' }}>
                    <Box size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      Add Product from 3rd-Party Products
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
                      Select a registered third-party product to add to the master catalog.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFromTpModal(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
                >
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleAddProductFromTp} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* 1. Dropdown of registered third party products */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                    Select Registered 3rd-Party Product *
                  </label>
                  <select
                    value={selectedTpId}
                    onChange={(e) => handleSelectTp(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    {thirdPartyProducts.length === 0 ? (
                      <option value="">No registered third-party products available</option>
                    ) : (
                      thirdPartyProducts.map((tp) => (
                        <option key={tp.id} value={tp.id}>
                          {tp.productName} ({tp.sku || tp.thirdPartySku || 'SKU'} - {tp.category}) &bull; {tp.supplierName || 'Vendor'}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 2. Specific Product Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                    Specific Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={specificProductName}
                    onChange={(e) => setSpecificProductName(e.target.value)}
                    placeholder="e.g. Heavy Duty Corrugated Shipping Box"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* 3. SKU */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                    Catalog SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={customSku}
                    onChange={(e) => setCustomSku(e.target.value)}
                    placeholder="e.g. PROD-BOX-005"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Preview Details from selected 3rd party product */}
                {(() => {
                  const currentTp = thirdPartyProducts.find((item) => String(item.id) === String(selectedTpId));
                  if (!currentTp) return null;
                  return (
                    <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontWeight: '800', color: '#0F4C81', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        Inherited Specification Details
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#475569' }}>
                        <div><strong>Packaging Type:</strong> {currentTp.category}</div>
                        <div><strong>Dimensions:</strong> {currentTp.dimensions}</div>
                        <div><strong>Material Spec:</strong> {currentTp.material}</div>
                        <div><strong>Registered Supplier:</strong> {currentTp.supplierName || 'N/A'}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddFromTpModal(false)}
                    style={{
                      padding: '0.6rem 1.1rem',
                      borderRadius: '0.6rem',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#475569',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAddProduct || thirdPartyProducts.length === 0}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '0.6rem',
                      border: 'none',
                      backgroundColor: '#F59E0B',
                      color: '#0F172A',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: submittingAddProduct ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <Plus size={16} />
                    <span>{submittingAddProduct ? 'Adding...' : 'Add to Master Catalog'}</span>
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
