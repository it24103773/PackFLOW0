import React, { useState, useEffect } from 'react';
import {
  fetchSuppliers,
  saveSupplier,
  fetchInventory,
  acceptMaterialOrder,
  fetchMySupplierProfile,
  updateMySupplierProfile,
  deleteMySupplierProfile,
  fetchSupplierMaterialHistory,
  deleteSupplierMaterialHistory,
  markSupplierPaymentNotificationRead,
  markAllSupplierPaymentsRead
} from '../../services/api';
import AnnouncementsSidebar from './AnnouncementsSidebar';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  CheckCircle2,
  Clock,
  Package,
  Edit,
  Save,
  Plus,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRight,
  Trash2,
  X,
  History,
  Search,
  Download,
  Printer,
  CreditCard,
  Building,
  Bell,
  BellRing,
  DollarSign,
  Receipt,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

export default function SupplierDashboard({ user, token }) {
  const { logout } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [materialHistory, setMaterialHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mySupplier, setMySupplier] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMaterialInput, setNewMaterialInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSelf, setDeletingSelf] = useState(false);
  const [suppliedSearchKeyword, setSuppliedSearchKeyword] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Supplier Acceptance with Bank Details State
  const [acceptingOrderModal, setAcceptingOrderModal] = useState(null);
  const [bankForm, setBankForm] = useState({
    bankName: 'Commercial Bank of Ceylon',
    accountHolderName: 'Yuthma Global Materials (Pvt) Ltd',
    accountNumber: '800129482019',
    branchName: 'Colombo Fort Commercial Branch',
    swiftCode: 'CCEYLKX',
    bankNotes: 'Order ready for dispatch upon Visa payment receipt.',
    unitPrice: 45.00
  });
  const [submittingAcceptance, setSubmittingAcceptance] = useState(false);

  // Supplier Visa Payment Notifications State
  const [showPaymentNotificationsModal, setShowPaymentNotificationsModal] = useState(false);
  const [viewReceiptModal, setViewReceiptModal] = useState(null);

  useEffect(() => {
    loadSupplierData();
    const interval = setInterval(() => {
      // Avoid overwriting transient form state while user is actively editing
      if (!editing) {
        loadSupplierData(true);
      }
    }, 3000);

    const handleFocus = () => {
      if (!editing) loadSupplierData(true);
    };
    const handleInventoryEvent = () => loadSupplierData(true);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('inventory-updated', handleInventoryEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('inventory-updated', handleInventoryEvent);
    };
  }, [editing]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadSupplierData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [suppliersData, materialsData, historyData] = await Promise.all([
        fetchSuppliers(),
        fetchInventory(),
        fetchSupplierMaterialHistory(null, token)
      ]);
      setSuppliers(suppliersData);
      setMaterials(materialsData);
      setMaterialHistory(Array.isArray(historyData) ? historyData : []);

      let myProf = null;
      try {
        if (token) {
          myProf = await fetchMySupplierProfile(token);
        }
      } catch (e) {
        console.warn('Could not load specific my-profile, falling back to lookup:', e.message);
      }

      if (!myProf) {
        myProf = suppliersData.find(s => s.email?.toLowerCase() === (user?.email?.toLowerCase() || 'yuthma@packflow.com')) || suppliersData[0];
      }

      const defaultData = {
        companyName: 'Yuthma Global Materials',
        contactPerson: user?.fullName || 'Yuthma Perera',
        email: user?.email || 'yuthma@packflow.com',
        phone: user?.mobileNumber || '+94 11 234 5678',
        address: 'No. 45, Industrial Zone, Colombo',
        category: 'Raw Materials & Inks',
        suppliedMaterials: ['Kraft Paperboard Rolls', 'Corrugated Flute Sheets', 'Cyan Flexo Ink', 'Matte Lamination Film'],
        availabilityStatus: 'In Stock',
        leadTimeDays: 3,
        rating: '4.9 / 5.0'
      };

      setMySupplier(prev => {
        // Only update if not editing or initial load
        return myProf || prev || defaultData;
      });
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Lookup price reference from Previous Supplied Materials History
  const getHistoryPrice = (matName) => {
    if (!matName) return 45.00;
    const found = materialHistory.find(h => h.materialName && h.materialName.trim().toLowerCase() === matName.trim().toLowerCase());
    if (found && found.unitPrice) return found.unitPrice;
    const partial = materialHistory.find(h => h.materialName && (h.materialName.toLowerCase().includes(matName.toLowerCase()) || matName.toLowerCase().includes(h.materialName.toLowerCase())));
    if (partial && partial.unitPrice) return partial.unitPrice;
    return 45.00;
  };

  const handleOpenAcceptModal = (order) => {
    const refPrice = order.unitPrice || getHistoryPrice(order.name);
    setBankForm({
      bankName: mySupplier?.bankName || 'Commercial Bank of Ceylon',
      accountHolderName: mySupplier?.companyName || user?.fullName || 'Yuthma Global Materials (Pvt) Ltd',
      accountNumber: mySupplier?.accountNumber || '800129482019',
      branchName: mySupplier?.branchName || 'Colombo Fort Commercial Branch',
      swiftCode: mySupplier?.swiftCode || 'CCEYLKX',
      bankNotes: 'Order accepted. Please transfer payment via Visa to initiate dispatch.',
      unitPrice: refPrice
    });
    setAcceptingOrderModal(order);
  };

  const handleConfirmAcceptance = async (e) => {
    e.preventDefault();
    if (!acceptingOrderModal) return;
    try {
      setSubmittingAcceptance(true);
      await acceptMaterialOrder(acceptingOrderModal.id, {
        bankName: bankForm.bankName,
        accountHolderName: bankForm.accountHolderName,
        accountNumber: bankForm.accountNumber,
        branchName: bankForm.branchName,
        swiftCode: bankForm.swiftCode,
        bankNotes: bankForm.bankNotes,
        unitPrice: Number(bankForm.unitPrice) || 45.00
      }, token);
      showToast(`Accepted order for "${acceptingOrderModal.name}"! Bank details sent to Inventory Manager for Visa card payment.`);
      setAcceptingOrderModal(null);
      loadSupplierData(true);
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert(err.message || 'Failed to accept material order');
    } finally {
      setSubmittingAcceptance(false);
    }
  };

  const handleMarkPaymentRead = async (id) => {
    try {
      await markSupplierPaymentNotificationRead(id, token);
      loadSupplierData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllPaymentsRead = async () => {
    try {
      await markAllSupplierPaymentsRead(token);
      showToast('All payment notifications marked as read.');
      loadSupplierData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptMaterialOrder = async (id, name) => {
    const item = materials.find(m => m.id === id);
    if (item) {
      handleOpenAcceptModal(item);
    } else {
      try {
        await acceptMaterialOrder(id, token);
        showToast(`Accepted raw material order for "${name}"!`);
        loadSupplierData(true);
        window.dispatchEvent(new CustomEvent('inventory-updated'));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDeleteHistoryItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from supplied history?`)) return;
    try {
      await deleteSupplierMaterialHistory(id, token);
      showToast(`Removed "${name}" from supplied material history.`);
      loadSupplierData(true);
    } catch (err) {
      alert(err.message || 'Failed to delete record');
    }
  };

  const handleSaveSupplierProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let updated;
      if (token) {
        updated = await updateMySupplierProfile(mySupplier, token);
      } else {
        updated = await saveSupplier(mySupplier, token);
      }
      if (updated && updated.email) {
        setMySupplier(updated);
      }
      setEditing(false);
      showToast('Supplier profile & information updated successfully!');
      loadSupplierData(true);
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterialInput.trim()) return;
    setMySupplier({
      ...mySupplier,
      suppliedMaterials: [...(mySupplier.suppliedMaterials || []), newMaterialInput.trim()]
    });
    setNewMaterialInput('');
  };

  const handleRemoveMaterial = (indexToRemove) => {
    setMySupplier({
      ...mySupplier,
      suppliedMaterials: (mySupplier.suppliedMaterials || []).filter((_, idx) => idx !== indexToRemove)
    });
  };

  const handleConfirmDeleteSelf = async () => {
    try {
      setDeletingSelf(true);
      if (token) {
        await deleteMySupplierProfile(token);
      }
      setShowDeleteModal(false);
      showToast('Supplier record deleted successfully. Logging out...');
      setTimeout(() => {
        logout();
      }, 1200);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingSelf(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontWeight: '600' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: '#6B21A8' }} />
        Loading Supplier Partner Dashboard...
      </div>
    );
  }

  // Filter materials by status & payments
  const onGoingMaterials = materials.filter(m => m.status === 'On-Going' || m.status === 'Ongoing');
  const acceptedMaterials = materials.filter(m => m.status === 'Accepted' || m.status === 'Available' || m.status === 'Low Stock');
  const paidMaterials = materials.filter(m => m.paymentStatus === 'Paid');
  const unreadPaidMaterials = materials.filter(m => m.paymentStatus === 'Paid' && (m.supplierPaymentNotificationRead === false || m.supplierPaymentNotificationRead === undefined));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          backgroundColor: '#065F46',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={20} style={{ color: '#34D399' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="card-rounded" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #581C87 0%, #3B0764 100%)',
        color: '#FFFFFF',
        borderRadius: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 10px 30px rgba(88, 28, 135, 0.2)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', color: '#E9D5FF' }}>
            <Truck size={16} />
            <span>Raw Material Vendor Partner Portal</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>Supplier Dashboard</h1>
          <p style={{ opacity: 0.9, marginTop: '0.35rem', fontSize: '0.95rem' }}>
            Review requested on-going raw material orders, accept material requests with bank details, and track Visa payments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Payment Received Notifications Bell Button */}
          <button
            onClick={() => setShowPaymentNotificationsModal(true)}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: unreadPaidMaterials.length > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.15)',
              border: unreadPaidMaterials.length > 0 ? '1.5px solid #34D399' : '1px solid rgba(255, 255, 255, 0.2)',
              color: unreadPaidMaterials.length > 0 ? '#6EE7B7' : '#FFFFFF',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: unreadPaidMaterials.length > 0 ? '0 0 15px rgba(52, 211, 153, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {unreadPaidMaterials.length > 0 ? (
              <BellRing size={19} className="animate-bounce" style={{ color: '#34D399' }} />
            ) : (
              <Bell size={19} />
            )}
            <span>Payment Notifications</span>
            {unreadPaidMaterials.length > 0 && (
              <span style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                borderRadius: '99px',
                padding: '0.15rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}>
                {unreadPaidMaterials.length} New
              </span>
            )}
          </button>

          <button
            onClick={() => setEditing(!editing)}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: '#FFFFFF',
              color: '#581C87',
              fontWeight: '800',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
          >
            <Edit size={18} />
            <span>{editing ? 'Cancel Editing' : 'Edit Profile & Catalog'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Payment Received Notification Alert Banner */}
      {unreadPaidMaterials.length > 0 && (
        <div className="card-rounded animate-fade-in" style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#ECFDF5',
          border: '1.5px solid #34D399',
          borderRadius: '1.25rem',
          boxShadow: '0 10px 25px rgba(5, 150, 105, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={26} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#064E3B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Payment Received Successfully!</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.15rem 0.55rem', borderRadius: '99px', border: '1px solid #A7F3D0' }}>
                  Visa Card Direct Deposit
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#047857', marginTop: '0.2rem' }}>
                Inventory Manager has paid for <strong>{unreadPaidMaterials.map(m => m.name).join(', ')}</strong> via Visa card. Funds transferred into your registered bank account!
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={() => setShowPaymentNotificationsModal(true)}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '0.65rem',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
              }}
            >
              <Receipt size={16} />
              <span>View Payment Receipts ({unreadPaidMaterials.length})</span>
            </button>
            <button
              onClick={handleMarkAllPaymentsRead}
              title="Acknowledge all payments"
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: '0.65rem',
                backgroundColor: '#FFFFFF',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                fontWeight: '700',
                fontSize: '0.825rem',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
        <div className="card-rounded" style={{ padding: '1.35rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>On-Going Material Requests</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '0.5rem' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#D97706', marginTop: '0.5rem' }}>
            {onGoingMaterials.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '0.2rem' }}>Awaiting supplier acceptance</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.35rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Accepted Materials</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#F0FDF4', color: '#16A34A', borderRadius: '0.5rem' }}>
              <CheckSquare size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#059669', marginTop: '0.5rem' }}>
            {acceptedMaterials.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.2rem' }}>Active in IM catalog</div>
        </div>

        <div
          className="card-rounded"
          onClick={() => setShowPaymentNotificationsModal(true)}
          style={{ padding: '1.35rem', background: '#FFFFFF', border: '1px solid #A7F3D0', borderRadius: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: unreadPaidMaterials.length > 0 ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: '700' }}>Visa Payments Received</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#D1FAE5', color: '#059669', borderRadius: '0.5rem' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#059669', marginTop: '0.5rem' }}>
            {paidMaterials.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.2rem', fontWeight: '600' }}>
            LKR {paidMaterials.reduce((sum, m) => sum + (m.totalPrice || ((m.unitPrice || getHistoryPrice(m.name)) * (m.purchasedStock || m.stockLevel || 0))), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Paid
          </div>
        </div>

        <div className="card-rounded" style={{ padding: '1.35rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Delivery Lead Time</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#F3E8FF', color: '#6B21A8', borderRadius: '0.5rem' }}>
              <Truck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#6B21A8', marginTop: '0.5rem' }}>
            {mySupplier?.leadTimeDays || 3} Days
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6B21A8', marginTop: '0.2rem' }}>Standard plant fulfillment</div>
        </div>
      </div>

      {/* SECTION: Requested On-Going Raw Packaging Materials (Supplier Acceptance Action) */}
      <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={22} style={{ color: '#D97706' }} />
              <span>Requested On-Going Raw Material Orders (Action Required)</span>
            </h3>
          </div>
          <span style={{ padding: '0.35rem 0.85rem', borderRadius: '99px', backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '0.825rem', fontWeight: '800' }}>
            {onGoingMaterials.length} Pending Acceptance
          </span>
        </div>

        {onGoingMaterials.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#059669', backgroundColor: '#F0FDF4', borderRadius: '0.85rem', border: '1px solid #DCFCE7' }}>
            <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem auto', color: '#10B981' }} />
            <div style={{ fontWeight: '700', fontSize: '1rem' }}>No Pending On-Going Material Requests!</div>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>All raw packaging material orders have been reviewed and accepted.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {onGoingMaterials.map(m => {
              const uPrice = m.unitPrice || getHistoryPrice(m.name);
              const qty = m.purchasedStock || m.stockLevel || 0;
              const totalValuation = uPrice * qty;
              return (
                <div key={m.id} style={{
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  backgroundColor: '#FFFBEB',
                  border: '1.5px solid #FCD34D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0F172A' }}>{m.name}</span>
                      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '0.4rem', backgroundColor: '#FFFFFF', color: '#B45309', fontSize: '0.775rem', fontWeight: '700', border: '1px solid #FDE68A' }}>
                        {m.category}
                      </span>
                      <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '0.75rem', fontWeight: '800' }}>
                        On-Going Order
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>Requested Stock: <strong style={{ color: '#0F4C81' }}>{qty.toLocaleString()} {m.unit}</strong></span>
                      <span style={{ backgroundColor: '#ECFDF5', color: '#065F46', padding: '0.2rem 0.55rem', borderRadius: '0.4rem', border: '1px solid #A7F3D0', fontWeight: '700' }}>
                        Unit Price: <strong>LKR {uPrice.toFixed(2)} / {m.unit}</strong>
                      </span>
                      <span style={{ backgroundColor: '#F0FDF4', color: '#059669', padding: '0.2rem 0.55rem', borderRadius: '0.4rem', border: '1px solid #86EFAC', fontWeight: '800' }}>
                        Total Valuation: <strong>LKR {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        (Price matched with Previous Supplied Materials History)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAcceptModal(m)}
                    style={{
                      padding: '0.75rem 1.35rem',
                      borderRadius: '0.65rem',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>Accept Order & Transfer to IM Catalog</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: Previous Supplied Materials History */}
      <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={22} style={{ color: '#059669' }} />
              <span>Previous Supplied Materials History ({materialHistory.length})</span>
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search supplied materials..."
                value={suppliedSearchKeyword}
                onChange={(e) => setSuppliedSearchKeyword(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.3rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
            <span style={{ padding: '0.35rem 0.85rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.825rem', fontWeight: '800' }}>
              {materialHistory.length} Supplied Items
            </span>
            <button
              onClick={() => setShowPdfModal(true)}
              title="Download / Print Previous Supplied Materials History PDF"
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '0.55rem',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '0.825rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              <Download size={15} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {(() => {
          const filteredSupplied = materialHistory.filter(m => {
            if (!suppliedSearchKeyword.trim()) return true;
            const kw = suppliedSearchKeyword.toLowerCase();
            return (
              m.materialName?.toLowerCase().includes(kw) ||
              m.category?.toLowerCase().includes(kw) ||
              m.supplierName?.toLowerCase().includes(kw) ||
              m.batchNumber?.toLowerCase().includes(kw)
            );
          });

          if (filteredSupplied.length === 0) {
            return (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '0.85rem', border: '1px dashed #CBD5E1' }}>
                <Package size={36} style={{ margin: '0 auto 0.5rem auto', color: '#94A3B8' }} />
                <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>No Supplied Materials Found</div>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>Accepted material orders will appear here in your previous supplied history.</p>
              </div>
            );
          }

          return (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Substrate / Material Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Supplied Quantity</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Unit Cost / Price</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Fulfillment Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Inventory Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Visa Payment Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupplied.map(m => {
                    const matchedMat = materials.find(mat => mat.name && mat.name.trim().toLowerCase() === m.materialName?.trim().toLowerCase());
                    const isPaid = matchedMat?.paymentStatus === 'Paid';
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Package size={16} style={{ color: '#581C87' }} />
                            <span>{m.materialName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ padding: '0.2rem 0.55rem', borderRadius: '0.4rem', backgroundColor: '#F3E8FF', color: '#581C87', fontSize: '0.775rem', fontWeight: '700' }}>
                            {m.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F4C81' }}>
                          {m.quantity} {m.unit || 'Units'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#059669', fontWeight: '700' }}>
                          LKR {(m.unitPrice || 45.00).toFixed(2)} / {m.unit || 'Unit'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.8rem', fontWeight: '600' }}>
                          {m.supplyDate || 'Active Inventory'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.775rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={13} /> {m.qualityStatus || 'Supplied & Active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {isPaid ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', backgroundColor: '#ECFDF5', color: '#065F46', fontSize: '0.775rem', fontWeight: '800', border: '1px solid #A7F3D0', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle2 size={12} /> Paid via Visa
                              </span>
                              <button
                                onClick={() => setViewReceiptModal(matchedMat)}
                                title="View Visa Payment Receipt Voucher"
                                style={{ padding: '0.2rem 0.5rem', borderRadius: '0.35rem', backgroundColor: '#F0FDF4', color: '#059669', border: '1px solid #86EFAC', fontSize: '0.725rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                              >
                                <Receipt size={12} /> Voucher
                              </button>
                            </div>
                          ) : (
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #E2E8F0', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} /> Pending Settlement
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteHistoryItem(m.id, m.materialName)}
                            title="Delete from Supplied History"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '0.4rem',
                              borderRadius: '0.375rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Supplier Profile & Catalog Details */}
      <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={20} style={{ color: '#581C87' }} />
            <span>Supplier Profile Details & Stock Information</span>
          </h3>
          <button
            onClick={() => setEditing(!editing)}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '0.65rem',
              backgroundColor: editing ? '#F1F5F9' : '#581C87',
              color: editing ? '#475569' : '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.85rem',
              border: editing ? '1px solid #CBD5E1' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: editing ? 'none' : '0 4px 12px rgba(88, 28, 135, 0.2)'
            }}
          >
            <Edit size={16} />
            <span>{editing ? 'Cancel Editing' : 'Edit My Information'}</span>
          </button>
        </div>

        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Company Name</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>{mySupplier?.companyName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Contact Person</div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A' }}>{mySupplier?.contactPerson || user?.fullName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Contact Email</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#581C87' }}>{mySupplier?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Mobile / Phone No</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>{mySupplier?.phone || mySupplier?.mobileNumber || user?.mobileNumber || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Category</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155' }}>{mySupplier?.category || 'Packaging Materials & Inks'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Office Address</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155' }}>{mySupplier?.address || 'Not specified'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Stock Availability</div>
                <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>
                  {mySupplier?.availabilityStatus || 'In Stock'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Delivery Lead Time</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>{mySupplier?.leadTimeDays || 3} Days</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.75rem' }}>Supplied Materials Catalog</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {mySupplier?.suppliedMaterials?.map((mat, idx) => (
                  <div key={idx} style={{ padding: '0.5rem 0.85rem', backgroundColor: '#F3E8FF', border: '1px solid #D8B4FE', borderRadius: '0.5rem', color: '#581C87', fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={16} />
                    <span>{mat}</span>
                  </div>
                ))}
              </div>
            </div>

            {mySupplier?.inquiryMessage && (
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700', marginBottom: '0.35rem' }}>Business Inquiry Message / Description</div>
                <div style={{ fontSize: '0.875rem', color: '#334155', fontStyle: 'italic' }}>&ldquo;{mySupplier.inquiryMessage}&rdquo;</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '0.65rem',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Trash2 size={16} />
                <span>Delete My Supplier Record</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveSupplierProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Company Name *</label>
                <input required type="text" value={mySupplier?.companyName || ''} onChange={(e) => setMySupplier({ ...mySupplier, companyName: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Contact Person Name *</label>
                <input required type="text" value={mySupplier?.contactPerson || ''} onChange={(e) => setMySupplier({ ...mySupplier, contactPerson: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Contact Email *</label>
                <input required type="email" value={mySupplier?.email || ''} onChange={(e) => setMySupplier({ ...mySupplier, email: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Mobile / Phone Number *</label>
                <input required type="text" value={mySupplier?.phone || mySupplier?.mobileNumber || ''} onChange={(e) => setMySupplier({ ...mySupplier, phone: e.target.value, mobileNumber: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Supplier Category</label>
                <input type="text" value={mySupplier?.category || ''} onChange={(e) => setMySupplier({ ...mySupplier, category: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} placeholder="e.g. Paperboard & Inks" />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Office Address</label>
                <input type="text" value={mySupplier?.address || ''} onChange={(e) => setMySupplier({ ...mySupplier, address: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} placeholder="Company Street Address & City" />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Business Inquiry Message / Description</label>
              <textarea rows="3" value={mySupplier?.inquiryMessage || ''} onChange={(e) => setMySupplier({ ...mySupplier, inquiryMessage: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }} placeholder="Describe your materials, capabilities or inquiry notes..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Availability Status</label>
                <select value={mySupplier?.availabilityStatus || 'In Stock'} onChange={(e) => setMySupplier({ ...mySupplier, availabilityStatus: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}>
                  <option value="In Stock">In Stock</option>
                  <option value="Limited">Limited Supply</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="On Demand">On Demand</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Delivery Lead Time (Days)</label>
                <input type="number" value={mySupplier?.leadTimeDays || 3} onChange={(e) => setMySupplier({ ...mySupplier, leadTimeDays: Number(e.target.value) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem', display: 'block' }}>Supplied Materials Catalog (Click X to Remove)</label>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {mySupplier?.suppliedMaterials?.map((mat, idx) => (
                  <div key={idx} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#F3E8FF', border: '1px solid #D8B4FE', borderRadius: '0.5rem', color: '#581C87', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{mat}</span>
                    <button type="button" onClick={() => handleRemoveMaterial(idx)} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.1rem' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="Add material name (e.g. Aqueous Varnish Solution)" value={newMaterialInput} onChange={(e) => setNewMaterialInput(e.target.value)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                <button type="button" onClick={handleAddMaterial} className="btn-secondary" style={{ padding: '0.65rem 1rem' }}>Add</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#581C87', fontWeight: '700' }}>
                {saving ? 'Saving Profile...' : 'Save & Update Information'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* --- DELETE SUPPLIER PROFILE MODAL --- */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '480px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={22} /> Delete Supplier Record
              </h3>
              <button onClick={() => setShowDeleteModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem' }}>
              Are you sure you want to delete your supplier record for <strong>{mySupplier?.companyName}</strong>? Your profile will be removed from system inventory and admin directory.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDeleteSelf} disabled={deletingSelf} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                {deletingSelf ? 'Deleting Record...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ACCEPT ORDER & SEND BANK DETAILS TO INVENTORY MANAGER --- */}
      {acceptingOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '95%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #E2E8F0',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.55rem', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '0.5rem' }}>
                  <Building size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Accept Order & Transfer to IM Catalog
                  </h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
                    Send your bank details to Inventory Manager for Visa card payment settlement
                  </span>
                </div>
              </div>
              <button onClick={() => setAcceptingOrderModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            {/* Order Summary & Pricing Box */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '0.85rem',
              padding: '1.15rem',
              border: '1px solid #E2E8F0',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0F172A' }}>{acceptingOrderModal.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Category: <strong>{acceptingOrderModal.category}</strong></div>
                </div>
                <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '0.75rem', fontWeight: '800' }}>
                  On-Going Request
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #CBD5E1' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Requested Quantity:</span>
                  <div style={{ fontWeight: '800', color: '#0F4C81', fontSize: '0.95rem' }}>
                    {(acceptingOrderModal.purchasedStock || acceptingOrderModal.stockLevel || 0).toLocaleString()} {acceptingOrderModal.unit}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Reference Unit Price:</span>
                  <div style={{ fontWeight: '800', color: '#059669', fontSize: '0.95rem' }}>
                    LKR {(Number(bankForm.unitPrice) || 45.00).toFixed(2)} / {acceptingOrderModal.unit}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', backgroundColor: '#ECFDF5', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #A7F3D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', color: '#065F46' }}>Total Amount to be Paid via Visa:</span>
                  <span style={{ fontWeight: '800', fontSize: '1.15rem', color: '#047857' }}>
                    LKR {(((Number(bankForm.unitPrice) || 45.00) * (acceptingOrderModal.purchasedStock || acceptingOrderModal.stockLevel || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.45rem', fontStyle: 'italic' }}>
                * Pricing is automatically referenced from Previous Supplied Materials History.
              </div>
            </div>

            {/* Bank Details Form */}
            <form onSubmit={handleConfirmAcceptance} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building size={16} style={{ color: '#581C87' }} />
                <span>Supplier Bank Deposit Information (For Visa Transfer)</span>
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Bank Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Commercial Bank of Ceylon / Bank of Ceylon / Sampath Bank"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Account Holder Name / Entity *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Yuthma Global Materials (Pvt) Ltd"
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Account Number *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 800129482019"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Colombo Fort Commercial Branch"
                    value={bankForm.branchName}
                    onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    SWIFT / Bank Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CCEYLKX"
                    value={bankForm.swiftCode}
                    onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Confirmed Unit Price (LKR) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="1"
                    value={bankForm.unitPrice}
                    onChange={(e) => setBankForm({ ...bankForm, unitPrice: e.target.value })}
                    style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: '700', color: '#059669' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>per {acceptingOrderModal.unit}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Delivery Instructions & Bank Notes for IM
                </label>
                <textarea
                  rows="2"
                  value={bankForm.bankNotes}
                  onChange={(e) => setBankForm({ ...bankForm, bankNotes: e.target.value })}
                  placeholder="Notes for Inventory Manager (e.g. Please transfer via Visa to initiate batch dispatch)..."
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setAcceptingOrderModal(null)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAcceptance}
                  className="btn-primary"
                  style={{
                    flex: 1.6,
                    padding: '0.75rem',
                    borderRadius: '0.65rem',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    cursor: submittingAcceptance ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{submittingAcceptance ? 'Transferring Order...' : 'Confirm Acceptance & Send Bank Details to IM'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: SUPPLIER VISA PAYMENT NOTIFICATIONS MODAL --- */}
      {showPaymentNotificationsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '95%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #E2E8F0',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.55rem', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '0.5rem' }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Supplier Payment Notifications (Visa Direct Settlements)
                  </h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
                    Notifications received when the Inventory Manager settles orders by Visa card
                  </span>
                </div>
              </div>
              <button onClick={() => setShowPaymentNotificationsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            {paidMaterials.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                <Clock size={40} style={{ margin: '0 auto 0.75rem auto', color: '#94A3B8' }} />
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0F172A' }}>No Visa Payments Received Yet</div>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.35rem' }}>
                  Once the Inventory Manager settles accepted raw packaging material orders via Visa card, notifications and transaction receipts will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>
                    Total Settled Orders: {paidMaterials.length} ({unreadPaidMaterials.length} Unread)
                  </span>
                  {unreadPaidMaterials.length > 0 && (
                    <button
                      onClick={handleMarkAllPaymentsRead}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.775rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <CheckCheck size={14} /> Mark All as Read
                    </button>
                  )}
                </div>

                {paidMaterials.map(item => {
                  const isUnread = item.supplierPaymentNotificationRead === false || item.supplierPaymentNotificationRead === undefined;
                  const itemAmount = item.totalPrice || ((item.unitPrice || getHistoryPrice(item.name)) * (item.purchasedStock || item.stockLevel || 0));

                  return (
                    <div key={item.id} style={{
                      padding: '1.25rem',
                      borderRadius: '1rem',
                      backgroundColor: isUnread ? '#ECFDF5' : '#F8FAFC',
                      border: isUnread ? '1.5px solid #34D399' : '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: isUnread ? '0 4px 14px rgba(5, 150, 105, 0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0F172A' }}>{item.name}</span>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.4rem', backgroundColor: '#FFFFFF', color: '#581C87', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #E9D5FF' }}>
                            {item.category}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '99px',
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                            fontSize: '0.8rem',
                            fontWeight: '800',
                            border: '1px solid #A7F3D0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                            <span>Payment Received Successfully!</span>
                          </span>

                          {isUnread && (
                            <button
                              onClick={() => handleMarkPaymentRead(item.id)}
                              style={{
                                backgroundColor: '#10B981',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '0.4rem',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Payment Details Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '0.65rem', border: '1px solid #E2E8F0', fontSize: '0.825rem' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block' }}>Amount Paid (LKR):</span>
                          <strong style={{ fontSize: '1.05rem', color: '#059669' }}>
                            LKR {itemAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block' }}>Payment Method:</span>
                          <strong style={{ color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CreditCard size={15} style={{ color: '#2563EB' }} /> Visa Card (ending in {item.cardLastFour || '4242'})
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block' }}>Bank Deposited To:</span>
                          <strong style={{ color: '#0F172A' }}>
                            {item.bankName || 'Commercial Bank'} (Acc: {item.accountNumber || '800129482019'})
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block' }}>Transaction ID:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#475569' }}>
                            {item.paymentTransactionId || `TXN-VISA-${item.id}-001`}
                          </span>
                        </div>
                        {item.paidAt && (
                          <div style={{ gridColumn: 'span 2', color: '#64748B', fontSize: '0.775rem' }}>
                            Settled on: <strong>{new Date(item.paidAt).toLocaleString()}</strong>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => setViewReceiptModal(item)}
                          style={{
                            padding: '0.45rem 0.95rem',
                            borderRadius: '0.5rem',
                            backgroundColor: '#059669',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Receipt size={14} /> View Visa Payment Voucher
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 3: OFFICIAL VISA PAYMENT RECEIPT VOUCHER MODAL --- */}
      {viewReceiptModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2.5rem',
            borderRadius: '1.25rem',
            width: '92%',
            maxWidth: '680px',
            border: '1px solid #CBD5E1',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#0F172A',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            {/* Voucher Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #059669', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#059669', margin: 0 }}>PackFLOW Packaging Ltd</h2>
                <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '700', marginTop: '0.2rem' }}>Procurement Supplier Payment Voucher</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Official Visa Card Electronic Settlement Record</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ padding: '0.25rem 0.75rem', borderRadius: '0.4rem', backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: '800', fontSize: '0.85rem', display: 'inline-block' }}>
                  PAID VIA VISA
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
                  Voucher No: <strong>{viewReceiptModal.paymentTransactionId || `VISA-VCH-${viewReceiptModal.id}`}</strong>
                </div>
                <div style={{ fontSize: '0.775rem', color: '#94A3B8' }}>
                  Date: {viewReceiptModal.paidAt ? new Date(viewReceiptModal.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Parties Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '0.85rem', border: '1px solid #E2E8F0', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Payer (Purchaser):</span>
                <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>PackFLOW Industrial Inventory Dept</strong>
                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Inventory Manager Visa Cardholder</div>
                <div style={{ color: '#2563EB', fontSize: '0.8rem', fontWeight: '700', marginTop: '0.25rem' }}>
                  Visa Card: •••• {viewReceiptModal.cardLastFour || '4242'}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Beneficiary (Supplier):</span>
                <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{viewReceiptModal.accountHolderName || mySupplier?.companyName || 'Yuthma Global Materials (Pvt) Ltd'}</strong>
                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Bank: <strong>{viewReceiptModal.bankName || 'Commercial Bank of Ceylon'}</strong></div>
                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Account No: <strong>{viewReceiptModal.accountNumber || '800129482019'}</strong></div>
                {viewReceiptModal.branchName && <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Branch: {viewReceiptModal.branchName}</div>}
              </div>
            </div>

            {/* Line Item Table */}
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#334155' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Item Description</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Category</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Unit Price (LKR)</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Total (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '700', color: '#0F172A' }}>{viewReceiptModal.name}</td>
                    <td style={{ padding: '0.75rem', color: '#581C87', fontWeight: '600' }}>{viewReceiptModal.category}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: '#0F4C81' }}>
                      {(viewReceiptModal.purchasedStock || viewReceiptModal.stockLevel || 0).toLocaleString()} {viewReceiptModal.unit}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#475569' }}>
                      LKR {(viewReceiptModal.unitPrice || getHistoryPrice(viewReceiptModal.name)).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                      LKR {(viewReceiptModal.totalPrice || ((viewReceiptModal.unitPrice || getHistoryPrice(viewReceiptModal.name)) * (viewReceiptModal.purchasedStock || viewReceiptModal.stockLevel || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #059669' }}>
                    <td colSpan="4" style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: '800', fontSize: '0.95rem', color: '#0F172A' }}>
                      Total Settled via Visa:
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: '800', fontSize: '1.15rem', color: '#059669' }}>
                      LKR {(viewReceiptModal.totalPrice || ((viewReceiptModal.unitPrice || getHistoryPrice(viewReceiptModal.name)) * (viewReceiptModal.purchasedStock || viewReceiptModal.stockLevel || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Voucher Footer & Print */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setViewReceiptModal(null)}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
              >
                Close Voucher
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary"
                style={{ flex: 1.5, padding: '0.7rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
              >
                <Printer size={16} /> Print / Save Voucher PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- PRINTABLE / DOWNLOADABLE PDF SUPPLIED MATERIAL HISTORY REPORT MODAL --- */}
      {showPdfModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2.5rem', borderRadius: '1.25rem', width: '92%', maxWidth: '900px', border: '1px solid #CBD5E1', maxHeight: '90vh', overflowY: 'auto', color: '#0F172A', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* PDF Report Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #059669', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#059669', margin: 0, letterSpacing: '-0.02em' }}>PackFLOW Packaging Ltd</h2>
                <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '700', marginTop: '0.2rem' }}>Official Supplier Material Supply History Report</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Industrial Packaging & Raw Material Supply Management</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ padding: '0.25rem 0.75rem', borderRadius: '0.4rem', backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: '800', fontSize: '0.85rem', display: 'inline-block' }}>OFFICIAL REPORT</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>Report Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                <div style={{ fontSize: '0.775rem', color: '#94A3B8' }}>System Generated Verification Record</div>
              </div>
            </div>

            {/* Supplier Information Summary Header Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '0.85rem', border: '1px solid #E2E8F0', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Supplier Organization:</span>
                <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{mySupplier?.companyName || 'Yuthma Global Materials'}</strong>
                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{mySupplier?.email || 'yuthma@packflow.com'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Contact Information:</span>
                <strong>{mySupplier?.contactPerson || user?.fullName || 'Yuthma Perera'}</strong>
                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{mySupplier?.phone || '+94 11 234 5678'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Supplied Catalog Summary:</span>
                <strong style={{ color: '#059669', fontSize: '0.95rem' }}>{materialHistory.length} Supplied Material Items</strong>
                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Lead Time: {mySupplier?.leadTimeDays || 3} Days</div>
              </div>
            </div>

            {/* Data Table */}
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#334155' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>#</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Substrate / Material Name</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Category</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Supplied Qty</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Total Valuation (LKR)</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Fulfillment Date</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {materialHistory.map((item, index) => {
                    const cost = item.totalCost || ((item.unitPrice || 45.00) * (item.quantity || 0));
                    return (
                      <tr key={item.id || index} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#64748B', fontWeight: '600' }}>{index + 1}</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700', color: '#0F172A' }}>{item.materialName}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#581C87', fontWeight: '600' }}>{item.category}</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: '700', color: '#0F4C81' }}>{item.quantity} {item.unit || 'Units'}</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#475569' }}>LKR {(item.unitPrice || 45.00).toFixed(2)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: '700', color: '#059669' }}>LKR {cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#64748B' }}>{item.supplyDate || 'Active Inventory'}</td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <span style={{ padding: '0.15rem 0.45rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.725rem', fontWeight: '800' }}>
                            {item.qualityStatus || 'Supplied & Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #059669' }}>
                    <td colSpan="5" style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: '800', fontSize: '0.9rem', color: '#0F172A' }}>
                      Grand Total Valuation of Supplied History:
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: '800', fontSize: '1rem', color: '#059669' }}>
                      LKR {materialHistory.reduce((sum, item) => sum + (item.totalCost || ((item.unitPrice || 45.00) * (item.quantity || 0))), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary"
                style={{ flex: 1.5, padding: '0.7rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
              >
                <Printer size={16} /> Print / Save PDF Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
