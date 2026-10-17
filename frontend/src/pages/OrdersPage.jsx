import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  fetchOrders,
  fetchMyOrders,
  submitPackagingRequirement,
  fetchPackagingTypes,
  convertOrderToThirdPartyProduct,
  updateOrderStatus,
  placeAndAssignOrder,
  assignStaffToOrder,
  rejectOrderByPm,
  fetchStaffMembers,
  deleteOrder
} from '../services/api';
import OrderHistoryTable from '../components/dashboards/OrderHistoryTable';

const PRESET_STAFF_MEMBERS = [
  'Nimal Perera (Flexo Printing Specialist)',
  'Sunil Shantha (Quality Inspector)',
  'Kamal Silva (Assembly & Folding Lead)',
  'Ruwan Fernando (Packaging Operator)',
  'Bandara Wickramasinghe (Die-Cutting Specialist)',
  'Chathura Jayasinghe (Glue & Lamination Technician)',
  'Dinesh Pathirana (Corrugated Production Assistant)',
  'Anura Kumara (Shipping & Handling Specialist)'
];

const PRESET_TASKS = [
  'Run flexo printing machine at 1200 units/hr with high color accuracy',
  'Setup flexo plate & calibrate ink density & viscosity',
  'Apply UV varnish & gloss lamination on outer box liner',
  'Setup die-cutting rotary mold & adjust impression pressure',
  'Perform automated die-cutting & stripping of corrugated sheets',
  'Check crease depth & fold line alignment on sample boxes',
  'Inspect die-cutting alignment, dimensions and burst strength on initial 50 units',
  'Inspect burst strength, Edge Crush Test (ECT) & print registration every 100 units',
  'Check dimensional tolerances (L x W x H) & flap closure tightness',
  'Execute precision box folding, side flap gluing and structural stacking',
  'Operate automatic folder-gluer machine at high speed',
  'Manual assembly of partition inserts & heavy-duty corner protectors',
  'Operate automatic bundling machine, shrink wrap pallets and label finished batches',
  'Bundle, strap with polypropylene bands & stretch-wrap pallets',
  'Affix barcode shipping labels & stack onto wooden pallets for dispatch',
  'Conduct drop test & humidity compression check on sample boxes'
];
import {
  ShoppingCart,
  CheckCircle2,
  Package,
  Send,
  AlertTriangle,
  Ruler,
  ArrowRightLeft,
  Eye,
  XCircle,
  Clock,
  User,
  Mail,
  FileText,
  Calendar,
  UserCheck,
  Sliders,
  Users,
  AlertOctagon,
  ShieldAlert,
  UserPlus,
  Ban,
  Search,
  Percent,
  PlayCircle,
  Trash2
} from 'lucide-react';

export default function OrdersPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('system administrator') || user?.role?.toLowerCase().includes('packaging');
  const isPM = user?.role?.toLowerCase().includes('packaging manager') || user?.role?.toLowerCase().includes('pm');

  const [orders, setOrders] = useState([]);
  const [packagingTypes, setPackagingTypes] = useState([]);
  const [registeredStaff, setRegisteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Selected Order for View Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // PM, Dates & 4-Member Group Modal State
  const [selectedAssignOrder, setSelectedAssignOrder] = useState(null);
  const [assignedManager, setAssignedManager] = useState('Damsak (Packaging Manager)');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [teamLeader, setTeamLeader] = useState('Kasun (Die-Cutting Lead)');
  const [member1, setMember1] = useState('Nimal (Flexo Printing Specialist)');
  const [member2, setMember2] = useState('Sunil (Quality Inspector)');
  const [member3, setMember3] = useState('Kamal (Assembly & Folding Lead)');
  const [member4, setMember4] = useState('Ruwan (Packaging Operator)');
  const [member1Task, setMember1Task] = useState('Setup flexo plate & calibrate ink density');
  const [member2Task, setMember2Task] = useState('Inspect burst strength & print registration');
  const [member3Task, setMember3Task] = useState('Operate automatic folder-gluer machine');
  const [member4Task, setMember4Task] = useState('Bundle, strap & palletize finished boxes');
  const [pmInstructions, setPmInstructions] = useState('Run flexo printing at 1200 units/hr. Check die-cutting alignment on initial 50 units.');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // PM Process Rejection Modal State
  const [selectedRejectOrder, setSelectedRejectOrder] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('Staff not enough for process execution');
  const [customReason, setCustomReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // PM Manually Edit Progress Modal State
  const [selectedProgressOrder, setSelectedProgressOrder] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [statusStage, setStatusStage] = useState('In Production (PM Approved)');
  const [submittingProgress, setSubmittingProgress] = useState(false);

  const [reqForm, setReqForm] = useState({
    packagingType: 'Corrugated Box',
    lengthMm: 300,
    widthMm: 200,
    heightMm: 150,
    quantity: 1000,
    material: 'Kraft Double Wall B-Flute',
    printFinish: 'Full Color Offset + Gloss Lamination',
    notes: 'Please ensure high compression strength for stackable shipping boxes.'
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);

    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSelectOrder = (o) => {
    setSelectedOrder(o);
  };

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [ordersData, typesData, staffData] = await Promise.all([
        isAdmin ? fetchOrders() : fetchMyOrders(token),
        fetchPackagingTypes(),
        fetchStaffMembers()
      ]);
      setOrders(ordersData);
      setPackagingTypes(typesData);
      setRegisteredStaff(staffData || []);
      if (typesData && typesData.length > 0 && !isSilent) {
        const firstType = typesData[0];
        setReqForm(prev => ({
          ...prev,
          packagingType: firstType.typeName,
          lengthMm: Math.round((firstType.minWidthMm + firstType.maxWidthMm) / 2),
          widthMm: Math.round((firstType.minHeightMm + firstType.maxHeightMm) / 2),
          heightMm: Math.round((firstType.minDepthMm + firstType.maxDepthMm) / 2)
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleOpenAssignModal = (order) => {
    setSelectedAssignOrder(order);
    setAssignedManager(order.assignedManager || 'Damsak (Packaging Manager)');
    setStartDate(order.startDate || new Date().toISOString().split('T')[0]);
    setEndDate(order.endDate || order.targetDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setPmInstructions(order.pmInstructions || 'Run flexo printing at 1200 units/hr. Check die-cutting alignment on initial 50 units.');
    setMember1Task(order.member1Task || 'Setup flexo plate & calibrate ink density');
    setMember2Task(order.member2Task || 'Inspect burst strength & print registration');
    setMember3Task(order.member3Task || 'Operate automatic folder-gluer machine');
    setMember4Task(order.member4Task || 'Bundle, strap & palletize finished boxes');
    if (order.teamLeader) setTeamLeader(order.teamLeader);
    if (order.teamMembers) {
      const parts = order.teamMembers.split(',').map(s => s.trim());
      if (parts[0]) setMember1(parts[0]);
      if (parts[1]) setMember2(parts[1]);
      if (parts[2]) setMember3(parts[2]);
      if (parts[3]) setMember4(parts[3]);
    }
  };

  const handleDeleteOrder = async (orderId, orderNum) => {
    if (!window.confirm(`Are you sure you want to delete Scheduled Production Order #${orderNum}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteOrder(orderId, token);
      showNotification(`Scheduled Production Order #${orderNum} deleted successfully!`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete order.');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignOrder) return;
    try {
      setSubmittingAssign(true);
      const teamMembersStr = `${member1}, ${member2}, ${member3}, ${member4}`;

      // 1. Update PM, Start Date, End Date, and Instructions
      await placeAndAssignOrder(
        selectedAssignOrder.id,
        startDate,
        endDate,
        assignedManager,
        token,
        pmInstructions
      );

      // 2. Assign staff team, leader, instructions & individual staff member tasks
      await assignStaffToOrder(
        selectedAssignOrder.id,
        teamLeader,
        teamMembersStr,
        'In Production (PM Approved)',
        token,
        pmInstructions,
        member1Task,
        member2Task,
        member3Task,
        member4Task
      );

      showNotification(`Order #${selectedAssignOrder.orderNumber} Approved & Scheduled! Assigned PM: ${assignedManager}, Start: ${startDate}, End: ${endDate}, Leader: ${teamLeader}`);
      setSelectedAssignOrder(null);
      window.dispatchEvent(new Event('orders-updated'));
      loadData(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleOpenRejectModal = (order) => {
    setSelectedRejectOrder(order);
    setRejectionReasonInput('Staff not enough for process execution');
    setCustomReason('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRejectOrder) return;
    try {
      setSubmittingReject(true);
      const finalReason = rejectionReasonInput === 'CUSTOM' ? customReason : rejectionReasonInput;
      await rejectOrderByPm(selectedRejectOrder.id, finalReason, token);
      showNotification(`Rejected process for Order #${selectedRejectOrder.orderNumber}. Reason: "${finalReason}"`);
      setSelectedRejectOrder(null);
      window.dispatchEvent(new Event('orders-updated'));
      loadData(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleOpenProgressModal = (order) => {
    setSelectedProgressOrder(order);
    setProgressValue(order.progressPercentage !== undefined && order.progressPercentage !== null ? Number(order.progressPercentage) : 0);
    setStatusStage(order.status || 'In Production (PM Approved)');
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProgressOrder) return;
    try {
      setSubmittingProgress(true);
      await updateOrderStatus(selectedProgressOrder.id, statusStage, Number(progressValue), token);
      showNotification(`Order #${selectedProgressOrder.orderNumber} Process Progress Updated to ${progressValue}% ("${statusStage}")!`);
      setSelectedProgressOrder(null);
      window.dispatchEvent(new Event('orders-updated'));
      loadData(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingProgress(false);
    }
  };

  const activeTypeSpec = packagingTypes.find(t => t.typeName === reqForm.packagingType);

  const getDimensionWarning = () => {
    if (!activeTypeSpec) return null;
    const errors = [];
    const l = Number(reqForm.lengthMm);
    const w = Number(reqForm.widthMm);
    const h = Number(reqForm.heightMm);

    if (activeTypeSpec.minWidthMm && l < activeTypeSpec.minWidthMm) errors.push(`Length below min (${activeTypeSpec.minWidthMm} mm)`);
    if (activeTypeSpec.maxWidthMm && l > activeTypeSpec.maxWidthMm) errors.push(`Length exceeds max (${activeTypeSpec.maxWidthMm} mm)`);
    if (activeTypeSpec.minHeightMm && w < activeTypeSpec.minHeightMm) errors.push(`Width below min (${activeTypeSpec.minHeightMm} mm)`);
    if (activeTypeSpec.maxHeightMm && w > activeTypeSpec.maxHeightMm) errors.push(`Width exceeds max (${activeTypeSpec.maxHeightMm} mm)`);
    if (activeTypeSpec.minDepthMm && h < activeTypeSpec.minDepthMm) errors.push(`Height below min (${activeTypeSpec.minDepthMm} mm)`);
    if (activeTypeSpec.maxDepthMm && h > activeTypeSpec.maxDepthMm) errors.push(`Height exceeds max (${activeTypeSpec.maxDepthMm} mm)`);

    return errors.length > 0 ? errors.join(', ') : null;
  };

  const dimensionWarning = getDimensionWarning();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (dimensionWarning) {
      if (!window.confirm(`Warning: Dimensions exceed defined constraints for ${reqForm.packagingType} (${dimensionWarning}). Submit custom requirement anyway?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const formattedDimensions = `${reqForm.lengthMm} x ${reqForm.widthMm} x ${reqForm.heightMm} mm`;

      await submitPackagingRequirement({
        customerName: user?.fullName || 'Valued Customer',
        customerEmail: user?.email || 'customer@packflow.com',
        packagingType: reqForm.packagingType,
        dimensions: formattedDimensions,
        quantity: Number(reqForm.quantity),
        printFinish: reqForm.printFinish,
        notes: `Material: ${reqForm.material} | Notes: ${reqForm.notes}`,
        status: 'Pending',
        progressPercentage: 0
      }, token);

      showNotification('Packaging Requirement Submitted Successfully!');
      setShowSubmitModal(false);
      window.dispatchEvent(new Event('orders-updated'));
      loadData(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineRequirement = async (order) => {
    if (!window.confirm(`Decline customer packaging requirement (Order #${order.orderNumber})?`)) return;
    try {
      await updateOrderStatus(order.id, 'Denied', 0, token);
      showNotification(`Order #${order.orderNumber} specification declined.`);
      setSelectedOrder(null);
      window.dispatchEvent(new Event('orders-updated'));
      loadData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConvertRequirement = async (order) => {
    if (!window.confirm(`Register customer requirement (Order #${order.orderNumber}) as a Third-Party Product Record?`)) return;
    try {
      await convertOrderToThirdPartyProduct(order.id, {
        productName: `${order.packagingType} Custom Spec (${order.customerName})`,
        notes: `Converted customer requirement from ${order.customerName} (${order.customerEmail}). Specs: ${order.dimensions}, Finish: ${order.printFinish}`
      }, token);
      showNotification(`Order #${order.orderNumber} registered into Registered 3rd-Party Products!`);
      setSelectedOrder(null);
      window.dispatchEvent(new Event('orders-updated'));
      loadData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const isPendingSpec = (o) => {
    if (!o || !o.status) return false;
    const st = o.status.toLowerCase();
    return st === 'pending' || st === 'submitted' || st === 'under review';
  };

  const [orderSearch, setOrderSearch] = useState('');

  const pendingSpecOrders = orders.filter(isPendingSpec);
  const activeProductionOrders = orders.filter(o => {
    if (!o || !o.status) return false;
    const st = o.status.toLowerCase();
    if (isPendingSpec(o) || st === 'pending admin registration' || st === 'denied' || st === 'rejected' || st.includes('waiting for customer')) return false;
    // For PM dashboard / production orders view, only show orders that have start & end dates assigned by Admin
    if (isPM && (!o.startDate || !o.endDate)) {
      return false;
    }
    return true;
  });

  const filteredProductionOrders = activeProductionOrders.filter(o => {
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase().trim();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.packagingType?.toLowerCase().includes(q) ||
      o.dimensions?.toLowerCase().includes(q) ||
      o.status?.toLowerCase().includes(q) ||
      o.assignedManager?.toLowerCase().includes(q) ||
      o.teamLeader?.toLowerCase().includes(q) ||
      o.teamMembers?.toLowerCase().includes(q) ||
      o.pmInstructions?.toLowerCase().includes(q) ||
      o.startDate?.includes(q) ||
      o.endDate?.includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Banner */}
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
              <ShoppingCart size={26} style={{ color: '#F59E0B' }} />
              <span>Customer Specifications & Production Orders</span>
            </h1>
          </div>
        </div>

        {toastMsg && (
          <div style={{ padding: '0.85rem 1.25rem', borderRadius: '0.75rem', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* --- SECTION 1: CUSTOMER PACKAGING SPECIFICATIONS (ACCEPT / REJECT) (ADMIN ONLY) --- */}
        {!isPM && (
          <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: '#059669' }} />
              <span>Customer Packaging Specifications ({pendingSpecOrders.length})</span>
            </h3>

            {loading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B' }}>Loading customer specifications...</div>
            ) : pendingSpecOrders.length === 0 ? (
              <div style={{ padding: '1.75rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', border: '1px dashed #CBD5E1', fontSize: '0.875rem' }}>
                No pending customer packaging specifications awaiting review.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Order #</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Customer Details</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Packaging Specification</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Qty</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Spec Notes</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Review Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSpecOrders.map((o) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFBEB' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0F4C81' }}>{o.orderNumber}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>{o.customerName}</div>
                          <div style={{ fontSize: '0.775rem', color: '#64748B' }}>{o.customerEmail}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: '700', color: '#D97706' }}>{o.packagingType}</div>
                          <div style={{ fontSize: '0.775rem', color: '#475569' }}>Dims: {o.dimensions} | Finish: {o.printFinish}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#059669' }}>{o.quantity?.toLocaleString()}</td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#64748B', maxWidth: '220px' }}>{o.notes || 'No special notes'}</td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleConvertRequirement(o)}
                              style={{ padding: '0.45rem 0.75rem', borderRadius: '0.45rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <CheckCircle2 size={14} /> Accept Spec
                            </button>
                            <button
                              onClick={() => handleDeclineRequirement(o)}
                              style={{ padding: '0.45rem 0.75rem', borderRadius: '0.45rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <XCircle size={14} /> Reject Spec
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {/* --- SECTION 2: REGISTERED 3RD-PARTY PRODUCTS & PRODUCTION ORDERS TABLE (PM ONLY) --- */}
        {isPM && (
          <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={20} style={{ color: '#D97706' }} />
                  <span>Scheduled Plant Production Orders ({filteredProductionOrders.length})</span>
                </h3>

              </div>

              <div style={{ position: 'relative', minWidth: '280px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search order #, customer, team, type..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading production orders...</div>
            ) : filteredProductionOrders.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                <Package size={40} style={{ color: '#94A3B8', marginBottom: '0.75rem' }} />
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>
                  {orderSearch ? `No scheduled production orders match "${orderSearch}"` : 'No scheduled production orders found'}
                </h4>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>
                  {orderSearch ? 'Try clearing your search query.' : 'Scheduled production orders assigned by Admin will appear here.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {filteredProductionOrders.map((o) => {
                  const isPMApproved = Boolean((o.teamMembers || o.assignedStaff) && (o.status?.includes('PM Approved') || o.teamLeader));
                  const isPMRejected = o.status === 'Rejected by PM' || o.status === 'Denied';
                  const isWaitingDeadline = o.status === 'Waiting for Customer Deadline';

                  return (
                    <div key={o.id} style={{ padding: '1.25rem', borderRadius: '1rem', border: isPMRejected ? '1px solid #FCA5A5' : isPMApproved ? '1px solid #A7F3D0' : '1px solid #FCD34D', backgroundColor: isPMRejected ? '#FEF2F2' : isPMApproved ? '#F0FDF4' : '#FFFBEB', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontWeight: '800', color: '#0F4C81', fontSize: '1.05rem', marginRight: '0.75rem' }}>{o.orderNumber}</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A' }}>{o.packagingType} ({o.quantity?.toLocaleString()} units)</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', backgroundColor: isPMRejected ? '#FEE2E2' : isPMApproved ? '#D1FAE5' : '#FEF3C7', color: isPMRejected ? '#DC2626' : isPMApproved ? '#047857' : '#D97706', fontSize: '0.8rem', fontWeight: '800' }}>
                            {o.status}
                          </span>
                          <button
                            onClick={() => handleSelectOrder(o)}
                            style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '0.775rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Eye size={13} /> View Specs
                          </button>
                          {(isAdmin || isPM) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                              title="Delete Scheduled Production Order"
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #FCA5A5',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.775rem',
                                fontWeight: '800'
                              }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        <strong>Customer:</strong> {o.customerName} ({o.customerEmail}) &bull; <strong>Dimensions:</strong> {o.dimensions} &bull; <strong>Finish:</strong> {o.printFinish}
                      </div>

                      {/* Financial & Advance Payment Breakdown */}
                      {o.totalPrice ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                          <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>Base Unit Price:</span> <strong style={{ color: '#0F172A' }}>LKR {o.unitPrice?.toFixed(2)}</strong></div>
                          <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>Subtotal:</span> <strong style={{ color: '#0F172A' }}>LKR {o.subtotal?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                          <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>20% Service Charge:</span> <strong style={{ color: '#D97706' }}>+LKR {o.serviceCharge?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                          <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>Total Calculated Price:</span> <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>LKR {o.totalPrice?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                          <div>
                            <span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>40% Advance Payment:</span>
                            <strong style={{ color: '#059669', fontSize: '0.825rem' }}>LKR {o.advancePayment?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
                            <span style={{ display: 'inline-block', backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', marginLeft: '0.3rem' }}>Paid 40%</span>
                          </div>
                          <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>60% Remaining Balance:</span> <strong style={{ color: '#0284C7' }}>LKR {o.remainingBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                        </div>
                      ) : null}

                      {/* Scheduled Operational Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                        <div><span style={{ color: '#64748B' }}>Assigned PM:</span> <strong style={{ color: '#D97706', display: 'block' }}>{o.assignedManager || 'Pending PM Assignment'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Start Date:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{o.startDate || 'TBD'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>End Date / Deadline:</span> <strong style={{ color: '#059669', display: 'block' }}>{o.endDate || o.targetDeadline || 'TBD'}</strong></div>
                      </div>

                      {/* Process Progress Bar */}
                      <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '0.65rem', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', fontWeight: '700' }}>
                          <span style={{ color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <PlayCircle size={16} style={{ color: '#D97706' }} /> Process Stage: <span style={{ color: '#D97706' }}>{o.status}</span>
                          </span>
                          <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.15rem 0.6rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800' }}>
                            {o.progressPercentage || 0}% Completed
                          </span>
                        </div>

                        <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${o.progressPercentage || 0}%`,
                            height: '100%',
                            backgroundColor: (o.progressPercentage || 0) === 100 ? '#10B981' : (o.progressPercentage || 0) >= 75 ? '#059669' : (o.progressPercentage || 0) >= 50 ? '#D97706' : '#F59E0B',
                            borderRadius: '99px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>

                      {/* Notice for Waiting Customer Deadline */}
                      {isWaitingDeadline && (
                        <div style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: '0.825rem', fontWeight: '600' }}>
                          ⏳ Order registered in 3rd-Party Products! Waiting for customer to provide target deadline and instructions on Customer Dashboard.
                        </div>
                      )}

                      {/* Rejection Display if Rejected */}
                      {isPMRejected && (
                        <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.75rem 1rem', borderRadius: '0.65rem', fontSize: '0.85rem', color: '#991B1B' }}>
                          <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                            <ShieldAlert size={18} /> Process Rejected / Declined
                          </div>
                          <div><strong>Reason:</strong> &ldquo;{o.rejectionReason || 'Specification declined or insufficient capacity'}&rdquo;</div>
                        </div>
                      )}

                      {/* Staff & PM Assignment Card */}
                      {isPMApproved && !isPMRejected ? (
                        <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.85rem 1rem', borderRadius: '0.65rem', fontSize: '0.825rem', color: '#047857', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                              <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: '#065F46', marginBottom: '0.25rem' }}>
                                <Users size={17} /> Approved Team Leader: {o.teamLeader || 'Kasun (Die-Cutting Lead)'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                                <strong>Assigned 4 Members:</strong> {o.teamMembers || o.assignedStaff}
                              </div>
                              {o.pmInstructions && (
                                <div style={{ fontSize: '0.775rem', color: '#065F46', marginTop: '0.35rem', backgroundColor: '#FFFFFF', padding: '0.4rem 0.65rem', borderRadius: '0.4rem', border: '1px dashed #A7F3D0' }}>
                                  <strong>PM Instructions:</strong> &ldquo;{o.pmInstructions}&rdquo;
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleOpenProgressModal(o)}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '0.45rem', border: 'none', backgroundColor: '#D97706', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <Percent size={14} /> Edit Process Progress (0-100%)
                              </button>
                              <button
                                onClick={() => handleOpenAssignModal(o)}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '0.45rem', border: '1px solid #A7F3D0', backgroundColor: '#FFFFFF', color: '#047857', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Edit 4-Member Team & Tasks
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(o)}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '0.45rem', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Reject Process
                              </button>
                            </div>
                          </div>

                          {/* Individual Tasks per 4 Staff Members */}
                          <div style={{ backgroundColor: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #A7F3D0' }}>
                            <div style={{ fontSize: '0.775rem', fontWeight: '800', color: '#065F46', marginBottom: '0.4rem' }}>
                              📋 Assigned Staff Tasks (4 Members):
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
                              <div style={{ backgroundColor: '#F0FDF4', padding: '0.4rem 0.6rem', borderRadius: '0.35rem', border: '1px solid #DCFCE7' }}>
                                <strong style={{ color: '#166534' }}>{o.teamMembers ? o.teamMembers.split(',')[0]?.trim() : 'Member 1'}:</strong>
                                <div style={{ color: '#15803D', marginTop: '0.15rem' }}>{o.member1Task || 'Setup flexo plate & calibrate ink density'}</div>
                              </div>
                              <div style={{ backgroundColor: '#F0FDF4', padding: '0.4rem 0.6rem', borderRadius: '0.35rem', border: '1px solid #DCFCE7' }}>
                                <strong style={{ color: '#166534' }}>{o.teamMembers ? o.teamMembers.split(',')[1]?.trim() : 'Member 2'}:</strong>
                                <div style={{ color: '#15803D', marginTop: '0.15rem' }}>{o.member2Task || 'Inspect burst strength & print registration'}</div>
                              </div>
                              <div style={{ backgroundColor: '#F0FDF4', padding: '0.4rem 0.6rem', borderRadius: '0.35rem', border: '1px solid #DCFCE7' }}>
                                <strong style={{ color: '#166534' }}>{o.teamMembers ? o.teamMembers.split(',')[2]?.trim() : 'Member 3'}:</strong>
                                <div style={{ color: '#15803D', marginTop: '0.15rem' }}>{o.member3Task || 'Operate automatic folder-gluer machine'}</div>
                              </div>
                              <div style={{ backgroundColor: '#F0FDF4', padding: '0.4rem 0.6rem', borderRadius: '0.35rem', border: '1px solid #DCFCE7' }}>
                                <strong style={{ color: '#166534' }}>{o.teamMembers ? o.teamMembers.split(',')[3]?.trim() : 'Member 4'}:</strong>
                                <div style={{ color: '#15803D', marginTop: '0.15rem' }}>{o.member4Task || 'Bundle, strap & palletize finished boxes'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : !isPMRejected ? (
                        <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.85rem 1rem', borderRadius: '0.65rem', fontSize: '0.825rem', color: '#92400E', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={18} /> Status: In Progress. Action Required: PM must assign 4-Member Plant Team & Production Instructions.
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleOpenAssignModal(o)}
                              style={{ padding: '0.5rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontSize: '0.825rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <UserPlus size={15} /> Assign 4-Member Team & Instructions
                            </button>
                            <button
                              onClick={() => handleOpenProgressModal(o)}
                              style={{ padding: '0.5rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', fontSize: '0.825rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Percent size={15} /> Edit Progress
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(o)}
                              style={{ padding: '0.5rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontSize: '0.825rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Ban size={15} /> Reject Process
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {o.customerInstructions && (
                        <div style={{ fontSize: '0.8rem', color: '#92400E', backgroundColor: '#FFFFFF', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #FCD34D' }}>
                          <strong>Customer Instructions & Target Deadline:</strong> {o.customerInstructions} ({o.targetDeadline || 'No date'})
                        </div>
                      )}

                      {o.notes && (
                        <div style={{ fontSize: '0.8rem', color: '#64748B', backgroundColor: '#FFFFFF', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px dashed #CBD5E1' }}>
                          <strong>Spec Notes:</strong> {o.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- SECTION 3: SYSTEM ORDER HISTORY TABLE --- */}
        <OrderHistoryTable token={token} isCustomer={false} />

        {/* --- MODAL 1: ORDER SPEC DETAILS MODAL --- */}
        {selectedOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '600px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.25rem 0.65rem', borderRadius: '99px', fontSize: '0.775rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    Order Requirement #{selectedOrder.orderNumber}
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>Packaging Specification Details</h3>
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={24} />
                </button>
              </div>

              {/* Order Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Customer Name</div>
                  <div style={{ fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={15} style={{ color: '#0F4C81' }} /> {selectedOrder.customerName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Customer Email</div>
                  <div style={{ fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={15} style={{ color: '#0F4C81' }} /> {selectedOrder.customerEmail}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Packaging Type Category</div>
                  <div style={{ fontWeight: '700', color: '#D97706' }}>{selectedOrder.packagingType}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Order Quantity</div>
                  <div style={{ fontWeight: '700', color: '#059669' }}>{selectedOrder.quantity?.toLocaleString()} units</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Required Dimensions</div>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>{selectedOrder.dimensions}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Print & Surface Finish</div>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>{selectedOrder.printFinish || 'N/A'}</div>
                </div>
              </div>

              {/* Order Financial Summary if calculated */}
              {selectedOrder.totalPrice && (
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: '800', color: '#92400E', textTransform: 'uppercase', fontSize: '0.775rem' }}>
                    💳 Order Pricing & Advance Payment Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', color: '#451A03' }}>
                    <div>Base Unit Price: <strong>LKR {selectedOrder.unitPrice?.toFixed(2)}</strong></div>
                    <div>Order Subtotal: <strong>LKR {selectedOrder.subtotal?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                    <div>Service Charge (20%): <strong style={{ color: '#D97706' }}>+LKR {selectedOrder.serviceCharge?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                    <div>Total Calculated Price: <strong>LKR {selectedOrder.totalPrice?.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                  </div>
                  <div style={{ borderTop: '1px dashed #F59E0B', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800' }}>
                    <span style={{ color: '#065F46' }}>✅ 40% Advance Payment Paid: LKR {selectedOrder.advancePayment?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    <span style={{ color: '#0284C7' }}>Remaining 60% Balance: LKR {selectedOrder.remainingBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              )}

              {/* Status Note */}
              <div style={{ padding: '0.85rem 1rem', borderRadius: '0.75rem', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: '0.85rem', marginBottom: '1.25rem', color: '#0369A1' }}>
                <strong>Current Requirement Status:</strong> {selectedOrder.status} ({selectedOrder.progressPercentage || 0}%)
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setSelectedOrder(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>
                  Close
                </button>

                {isAdmin && selectedOrder.status !== 'Denied' && !selectedOrder.status.includes('Waiting for Customer') && selectedOrder.status !== 'In Progress' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDeclineRequirement(selectedOrder)}
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '0.65rem', backgroundColor: '#DC2626', color: '#FFFFFF', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <XCircle size={16} /> Decline Spec
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConvertRequirement(selectedOrder)}
                      className="btn-primary"
                      style={{ flex: 1.5, padding: '0.75rem', borderRadius: '0.65rem', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <ArrowRightLeft size={16} /> Accept Specification
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        )}

        {/* --- MODAL 2: PM ASSIGN, SCHEDULE & 4-MEMBER TEAM MODAL --- */}
        {selectedAssignOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '580px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#D97706', backgroundColor: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: '0.35rem' }}>
                    Order #{selectedAssignOrder.orderNumber}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginTop: '0.35rem', marginBottom: 0 }}>
                    Assign PM, Start & End Dates, and 4-Member Team
                  </h3>
                </div>
                <button onClick={() => setSelectedAssignOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={22} />
                </button>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '0.65rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div><strong>Packaging Spec:</strong> {selectedAssignOrder.packagingType} ({selectedAssignOrder.quantity?.toLocaleString()} units)</div>
                <div><strong>Customer:</strong> {selectedAssignOrder.customerName} ({selectedAssignOrder.customerEmail})</div>
                {selectedAssignOrder.customerInstructions && (
                  <div style={{ color: '#0369A1', marginTop: '0.25rem' }}><strong>Customer Deadline Notes:</strong> {selectedAssignOrder.customerInstructions} ({selectedAssignOrder.targetDeadline || 'TBD'})</div>
                )}
              </div>

              <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* PM Selector */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F4C81', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <User size={16} /> 1. Select Packaging Manager (PM)
                  </label>
                  <select
                    value={assignedManager}
                    onChange={(e) => setAssignedManager(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: '700', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Damsak (Packaging Manager)">Damsak (Packaging Manager)</option>
                    <option value="Senura Perera (PM)">Senura Perera (PM)</option>
                    <option value="Kasun Jayawardena (Plant Manager)">Kasun Jayawardena (Plant Manager)</option>
                  </select>
                </div>

                {/* Start & End Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F4C81', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                      <Calendar size={16} /> 2. Start Date
                    </label>
                    <input
                      required
                      type="date"
                      min={new Date().toLocaleDateString('en-CA')}
                      value={startDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setStartDate(newStart);
                        if (endDate && endDate < newStart) {
                          setEndDate(newStart);
                        }
                      }}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: '700' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                      <Calendar size={16} /> 3. End Date
                    </label>
                    <input
                      required
                      type="date"
                      min={startDate || new Date().toLocaleDateString('en-CA')}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: '700' }}
                    />
                  </div>
                </div>

                {/* Team Leader */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F4C81', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <UserCheck size={16} /> 4. Select Plant Group Leader
                  </label>
                  <select
                    value={teamLeader}
                    onChange={(e) => setTeamLeader(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: '700', backgroundColor: '#FFFFFF' }}
                  >
                    {(registeredStaff && registeredStaff.length > 0 ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`) : PRESET_STAFF_MEMBERS).map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* 4 Members & Tasks */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <Users size={16} /> 5. Assign 4 Plant Group Members & Select Tasks
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    
                    <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Staff Member 1 & Task:</span>
                      <select
                        value={member1}
                        onChange={(e) => setMember1(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #CBD5E1', fontSize: '0.825rem', fontWeight: '700', backgroundColor: '#FFFFFF', marginBottom: '0.3rem' }}
                      >
                        {(registeredStaff && registeredStaff.length > 0 ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`) : PRESET_STAFF_MEMBERS).map((st, idx) => (
                          <option key={idx} value={st}>{st}</option>
                        ))}
                      </select>
                      <select
                        value={member1Task}
                        onChange={(e) => setMember1Task(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #93C5FD', fontSize: '0.8rem', color: '#1E40AF', backgroundColor: '#FFFFFF', fontWeight: '600' }}
                      >
                        {PRESET_TASKS.map((tsk, idx) => (
                          <option key={idx} value={tsk}>{tsk}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Staff Member 2 & Task:</span>
                      <select
                        value={member2}
                        onChange={(e) => setMember2(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #CBD5E1', fontSize: '0.825rem', fontWeight: '700', backgroundColor: '#FFFFFF', marginBottom: '0.3rem' }}
                      >
                        {(registeredStaff && registeredStaff.length > 0 ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`) : PRESET_STAFF_MEMBERS).map((st, idx) => (
                          <option key={idx} value={st}>{st}</option>
                        ))}
                      </select>
                      <select
                        value={member2Task}
                        onChange={(e) => setMember2Task(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #93C5FD', fontSize: '0.8rem', color: '#1E40AF', backgroundColor: '#FFFFFF', fontWeight: '600' }}
                      >
                        {PRESET_TASKS.map((tsk, idx) => (
                          <option key={idx} value={tsk}>{tsk}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Staff Member 3 & Task:</span>
                      <select
                        value={member3}
                        onChange={(e) => setMember3(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #CBD5E1', fontSize: '0.825rem', fontWeight: '700', backgroundColor: '#FFFFFF', marginBottom: '0.3rem' }}
                      >
                        {(registeredStaff && registeredStaff.length > 0 ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`) : PRESET_STAFF_MEMBERS).map((st, idx) => (
                          <option key={idx} value={st}>{st}</option>
                        ))}
                      </select>
                      <select
                        value={member3Task}
                        onChange={(e) => setMember3Task(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #93C5FD', fontSize: '0.8rem', color: '#1E40AF', backgroundColor: '#FFFFFF', fontWeight: '600' }}
                      >
                        {PRESET_TASKS.map((tsk, idx) => (
                          <option key={idx} value={tsk}>{tsk}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Staff Member 4 & Task:</span>
                      <select
                        value={member4}
                        onChange={(e) => setMember4(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #CBD5E1', fontSize: '0.825rem', fontWeight: '700', backgroundColor: '#FFFFFF', marginBottom: '0.3rem' }}
                      >
                        {(registeredStaff && registeredStaff.length > 0 ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`) : PRESET_STAFF_MEMBERS).map((st, idx) => (
                          <option key={idx} value={st}>{st}</option>
                        ))}
                      </select>
                      <select
                        value={member4Task}
                        onChange={(e) => setMember4Task(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #93C5FD', fontSize: '0.8rem', color: '#1E40AF', backgroundColor: '#FFFFFF', fontWeight: '600' }}
                      >
                        {PRESET_TASKS.map((tsk, idx) => (
                          <option key={idx} value={tsk}>{tsk}</option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* PM Production Instructions */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F4C81', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <FileText size={16} /> 6. PM Production Instructions for Team
                  </label>
                  <textarea
                    rows="3"
                    value={pmInstructions}
                    onChange={(e) => setPmInstructions(e.target.value)}
                    placeholder="Enter specific plant & staff execution instructions..."
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setSelectedAssignOrder(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Cancel</button>
                  <button type="submit" disabled={submittingAssign} className="btn-primary" style={{ flex: 1.5, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <UserCheck size={16} />
                    {submittingAssign ? 'Saving PM & Schedule...' : 'Save PM, Dates & Assign Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL 3: PM REJECT PROCESS MODAL --- */}
        {selectedRejectOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '520px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#DC2626', backgroundColor: '#FEE2E2', padding: '0.2rem 0.5rem', borderRadius: '0.35rem' }}>
                    Order #{selectedRejectOrder.orderNumber}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#991B1B', marginTop: '0.35rem', marginBottom: 0 }}>
                    Reject Production Process
                  </h3>
                </div>
                <button onClick={() => setSelectedRejectOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={22} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>
                Specify the reason for rejecting this packaging process. This reason will be logged and communicated.
              </p>

              <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <AlertOctagon size={16} style={{ color: '#DC2626' }} /> Select Rejection Reason
                  </label>
                  <select
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.875rem', fontWeight: '600' }}
                  >
                    <option value="Staff not enough for process execution">Staff not enough for process execution</option>
                    <option value="Plant equipment / die-cutting machinery under maintenance">Plant equipment / die-cutting machinery under maintenance</option>
                    <option value="Raw paperboard / corrugated stock inventory shortage">Raw paperboard / corrugated stock inventory shortage</option>
                    <option value="Target deadline impossible under current plant capacity">Target deadline impossible under current plant capacity</option>
                    <option value="CUSTOM">+ Enter Custom Rejection Reason...</option>
                  </select>
                </div>

                {rejectionReasonInput === 'CUSTOM' && (
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                      Custom Rejection Reason
                    </label>
                    <textarea
                      required
                      rows="3"
                      placeholder="Enter detailed reason for rejecting process..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.85rem' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setSelectedRejectOrder(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Cancel</button>
                  <button type="submit" disabled={submittingReject} className="btn-primary" style={{ flex: 1.5, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Ban size={16} />
                    {submittingReject ? 'Rejecting...' : 'Reject Process'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL 4: SUBMIT REQUIREMENT MODAL --- */}
        {showSubmitModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '580px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>Submit Custom Packaging Requirement</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem' }}>Specify required packaging type, dimensions, quantity & material finish.</p>

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Packaging Type</label>
                  <select
                    value={reqForm.packagingType}
                    onChange={(e) => {
                      const selected = e.target.value;
                      const typeObj = packagingTypes.find(t => t.typeName === selected);
                      setReqForm({
                        ...reqForm,
                        packagingType: selected,
                        lengthMm: typeObj ? Math.round((typeObj.minWidthMm + typeObj.maxWidthMm) / 2) : reqForm.lengthMm,
                        widthMm: typeObj ? Math.round((typeObj.minHeightMm + typeObj.maxHeightMm) / 2) : reqForm.widthMm,
                        heightMm: typeObj ? Math.round((typeObj.minDepthMm + typeObj.maxDepthMm) / 2) : reqForm.heightMm,
                        material: typeObj?.supportedMaterials?.split(',')[0] || reqForm.material
                      });
                    }}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                  >
                    {packagingTypes.map(t => (
                      <option key={t.id} value={t.typeName}>{t.typeName}</option>
                    ))}
                  </select>
                </div>

                {activeTypeSpec && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '0.65rem', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: '0.825rem', color: '#0369A1' }}>
                    <div style={{ fontWeight: '700', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Ruler size={14} /> Allowed Dimension Constraints for {activeTypeSpec.typeName}:
                    </div>
                    <div>Length: <strong>{activeTypeSpec.minWidthMm} - {activeTypeSpec.maxWidthMm} mm</strong> &bull; Width: <strong>{activeTypeSpec.minHeightMm} - {activeTypeSpec.maxHeightMm} mm</strong> &bull; Height: <strong>{activeTypeSpec.minDepthMm} - {activeTypeSpec.maxDepthMm} mm</strong></div>
                    <div>Max Weight Capacity: <strong>{activeTypeSpec.maxWeightCapacityKg} kg</strong></div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Length (mm)</label>
                    <input required type="number" value={reqForm.lengthMm} onChange={(e) => setReqForm({ ...reqForm, lengthMm: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Width (mm)</label>
                    <input required type="number" value={reqForm.widthMm} onChange={(e) => setReqForm({ ...reqForm, widthMm: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Height (mm)</label>
                    <input required type="number" value={reqForm.heightMm} onChange={(e) => setReqForm({ ...reqForm, heightMm: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                  </div>
                </div>

                {dimensionWarning && (
                  <div style={{ padding: '0.6rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    <span>Constraint Notice: {dimensionWarning}</span>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Order Quantity (Units)</label>
                  <input required type="number" min="50" value={reqForm.quantity} onChange={(e) => setReqForm({ ...reqForm, quantity: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Material Preference</label>
                  <input required type="text" value={reqForm.material} onChange={(e) => setReqForm({ ...reqForm, material: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Print & Surface Finish Specs</label>
                  <input required type="text" value={reqForm.printFinish} onChange={(e) => setReqForm({ ...reqForm, printFinish: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Special Die-Line Notes</label>
                  <textarea rows="3" value={reqForm.notes} onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowSubmitModal(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9' }}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#059669' }}>
                    {submitting ? 'Submitting...' : 'Submit Order Spec'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL 5: PM MANUALLY EDIT PROCESS PROGRESS MODAL --- */}
        {selectedProgressOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '550px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#D97706', backgroundColor: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: '0.35rem' }}>
                    Order #{selectedProgressOrder.orderNumber}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginTop: '0.35rem', marginBottom: 0 }}>
                    Manually Edit Process Progress
                  </h3>
                </div>
                <button onClick={() => setSelectedProgressOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={22} />
                </button>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '0.65rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div><strong>Packaging Spec:</strong> {selectedProgressOrder.packagingType} ({selectedProgressOrder.quantity?.toLocaleString()} units)</div>
                <div><strong>Customer:</strong> {selectedProgressOrder.customerName}</div>
                <div><strong>Team Leader:</strong> {selectedProgressOrder.teamLeader || 'Kasun (Die-Cutting Lead)'}</div>
                <div><strong>Team Members:</strong> {selectedProgressOrder.teamMembers || selectedProgressOrder.assignedStaff || '4 Members Assigned'}</div>
              </div>

              <form onSubmit={handleProgressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Stage Presets Quick Select */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F4C81', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    <PlayCircle size={16} /> Select Production Stage Preset
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { pct: 0, stage: 'In Production (Setup & Prep)' },
                      { pct: 25, stage: 'In Production (Flexo Printing Stage)' },
                      { pct: 50, stage: 'In Production (Die-Cutting Stage)' },
                      { pct: 75, stage: 'In Production (Assembly & Gluing Stage)' },
                      { pct: 90, stage: 'In Production (Quality Audit & Bundling)' },
                      { pct: 100, stage: 'Production Completed & Ready for Dispatch' }
                    ].map(preset => (
                      <button
                        key={preset.pct}
                        type="button"
                        onClick={() => {
                          setProgressValue(preset.pct);
                          setStatusStage(preset.stage);
                        }}
                        style={{
                          padding: '0.5rem 0.65rem',
                          borderRadius: '0.5rem',
                          border: progressValue === preset.pct ? '2px solid #D97706' : '1px solid #CBD5E1',
                          backgroundColor: progressValue === preset.pct ? '#FEF3C7' : '#FFFFFF',
                          color: progressValue === preset.pct ? '#92400E' : '#334155',
                          fontWeight: '700',
                          fontSize: '0.775rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ color: '#D97706', fontWeight: '800' }}>{preset.pct}%</span> - {preset.stage.replace('In Production (', '').replace(')', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Stage Title */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Process Stage Title / Status Description
                  </label>
                  <input
                    required
                    type="text"
                    value={statusStage}
                    onChange={(e) => setStatusStage(e.target.value)}
                    placeholder="e.g. In Production (Die-Cutting Stage)"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: '700' }}
                  />
                </div>

                {/* Progress Slider & Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Percent size={16} /> Progress Percentage (0% - 100%)
                    </label>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#D97706' }}>{progressValue}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressValue}
                    onChange={(e) => setProgressValue(Number(e.target.value))}
                    style={{ width: '100%', height: '8px', cursor: 'pointer', accentColor: '#D97706' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                    <span>0% (Setup)</span>
                    <span>50% (Die-Cutting)</span>
                    <span>100% (Completed)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setSelectedProgressOrder(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Cancel</button>
                  <button type="submit" disabled={submittingProgress} className="btn-primary" style={{ flex: 1.5, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#D97706', color: '#FFFFFF', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Percent size={16} />
                    {submittingProgress ? 'Updating...' : `Save Progress (${progressValue}%)`}
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
