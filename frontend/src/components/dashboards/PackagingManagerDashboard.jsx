import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchOrders,
  fetchInventory,
  fetchStaffMembers,
  assignStaffToOrder,
  rejectOrderByPm,
  updateOrderStatus,
  deleteOrder,
  fetchPackagingTasks,
  unassignPackagingTask,
  assignPackagingTask,
  unassignStaffFromOrder,
  assignStaffMemberToOrder
} from '../../services/api';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Search,
  Users,
  ShoppingCart,
  Calendar,
  UserCheck,
  Clock,
  ShieldAlert,
  XCircle,
  FileText,
  Ban,
  Sliders,
  Package,
  User,
  AlertOctagon,
  Percent,
  PlayCircle,
  CheckSquare,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  UserMinus,
  RotateCcw
} from 'lucide-react';

const getOrderTasks = (order) => {
  if (!order) return [];
  if (order.assignedTasksJson) {
    try {
      const parsed = JSON.parse(order.assignedTasksJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          member: item.member || item.name || `Staff Member ${idx + 1}`,
          task: item.task || 'Assigned packaging duty'
        }));
      }
    } catch (e) {}
  }
  if (order.teamMembers) {
    const parts = order.teamMembers.split(',').map(s => s.trim()).filter(Boolean);
    const legacyTasks = [order.member1Task, order.member2Task, order.member3Task, order.member4Task];
    return parts.map((m, idx) => ({
      member: m,
      task: legacyTasks[idx] || 'Assigned packaging duty'
    }));
  }
  return [];
};


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

export default function PackagingManagerDashboard({ token }) {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [registeredStaff, setRegisteredStaff] = useState([]);
  const [packagingTasks, setPackagingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // PM Assign Staff Team & Individual Tasks Modal State (Dynamic Employees & Tasks)
  const [selectedAssignOrder, setSelectedAssignOrder] = useState(null);
  const [assignStep, setAssignStep] = useState(1); // 1 = Select Employees, 2 = Assign Tasks
  const [teamLeader, setTeamLeader] = useState('Kasun (Die-Cutting Lead)');
  const [teamMembersList, setTeamMembersList] = useState([]); // [{ name: '', task: '' }]
  const [pmInstructions, setPmInstructions] = useState('Ensure zero dimension deviation on die-cutting alignment. Complete batch by end date.');
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
  const [showUrgentModal, setShowUrgentModal] = useState(false);

  const [orderSearch, setOrderSearch] = useState('');

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders(true);
    }, 3000);

    const handleFocus = () => loadOrders(true);
    const handleInventoryEvent = () => loadOrders(true);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('inventory-updated', handleInventoryEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('inventory-updated', handleInventoryEvent);
    };
  }, []);

  const loadOrders = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [ordersData, materialsData, staffData, tasksData] = await Promise.all([
        fetchOrders(),
        fetchInventory(),
        fetchStaffMembers(),
        fetchPackagingTasks(token).catch(() => [])
      ]);
      setOrders(ordersData);
      setMaterials(materialsData);
      setRegisteredStaff(staffData || []);
      setPackagingTasks(tasksData || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleQuickUnassign = async (orderId, memberName, taskId) => {
    try {
      const numericTaskId = (taskId && !String(taskId).startsWith('temp-')) ? taskId : null;
      if (numericTaskId) {
        try {
          await unassignPackagingTask(numericTaskId, token);
        } catch (e) {
          console.warn("Direct task unassign error:", e);
        }
      }
      await unassignStaffFromOrder(orderId, memberName, token, numericTaskId);
      setToastMsg(`Status changed to "Unassigned" for ${memberName} in packaing_tasks table.`);
      setTimeout(() => setToastMsg(''), 4500);
      loadOrders(true);
    } catch (err) {
      alert(err.message || 'Failed to unassign staff member');
    }
  };

  const handleQuickAssign = async (orderId, memberName, taskDesc, taskId) => {
    try {
      const numericTaskId = (taskId && !String(taskId).startsWith('temp-')) ? taskId : null;
      if (numericTaskId) {
        try {
          await assignPackagingTask(numericTaskId, token);
        } catch (e) {
          console.warn("Direct task assign error:", e);
        }
      }
      await assignStaffMemberToOrder(orderId, memberName, taskDesc || 'Assigned packaging task', token);
      setToastMsg(`Status changed to "Assigned" for ${memberName} in packaing_tasks table.`);
      setTimeout(() => setToastMsg(''), 4500);
      loadOrders(true);
    } catch (err) {
      alert(err.message || 'Failed to assign staff member');
    }
  };




  const handleOpenAssignModal = (order) => {
    setSelectedAssignOrder(order);
    setAssignStep(1);

    if (order.teamLeader) {
      setTeamLeader(order.teamLeader);
    } else {
      const leaderDefault = registeredStaff && registeredStaff.length > 0
        ? `${registeredStaff[0].fullName} (${registeredStaff[0].roleSpecialty || registeredStaff[0].department || 'Staff'})`
        : PRESET_STAFF_MEMBERS[0];
      setTeamLeader(leaderDefault);
    }

    // Parse existing assigned tasks / members from packaing_tasks table first
    let initialMembers = [];
    const activeTasksFromDb = (packagingTasks || []).filter(t => 
      t.orderId === order.id && 
      ((t.status || '').toLowerCase() === 'assigned' || (t.status || '').toLowerCase() === 'assign')
    );
    if (activeTasksFromDb.length > 0) {
      initialMembers = activeTasksFromDb.map(t => ({
        name: t.staffMember,
        task: t.taskDescription || PRESET_TASKS[0]
      }));
    } else if (order.assignedTasksJson) {
      try {
        const parsed = JSON.parse(order.assignedTasksJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialMembers = parsed.map((item, idx) => ({
            name: item.member || item.name || '',
            task: item.task || PRESET_TASKS[idx % PRESET_TASKS.length]
          })).filter(m => m.name);
        }
      } catch (e) {}
    }

    if (initialMembers.length === 0 && order.teamMembers) {
      const parts = order.teamMembers.split(',').map(s => s.trim()).filter(Boolean);
      const legacyTasks = [
        order.member1Task || PRESET_TASKS[0],
        order.member2Task || PRESET_TASKS[1],
        order.member3Task || PRESET_TASKS[2],
        order.member4Task || PRESET_TASKS[3]
      ];
      initialMembers = parts.map((name, idx) => ({
        name,
        task: legacyTasks[idx] || PRESET_TASKS[idx % PRESET_TASKS.length]
      }));
    }

    if (initialMembers.length === 0) {
      const staffPool = (registeredStaff && registeredStaff.length > 0)
        ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`)
        : PRESET_STAFF_MEMBERS;
      
      const defaults = staffPool.slice(0, 3);
      initialMembers = defaults.map((name, idx) => ({
        name,
        task: PRESET_TASKS[idx % PRESET_TASKS.length]
      }));
    }

    setTeamMembersList(initialMembers);
    setPmInstructions(order.pmInstructions || 'Ensure zero dimension deviation on die-cutting alignment. Complete batch by end date.');
  };

  const handleAddMember = (staffName = '') => {
    const staffPool = (registeredStaff && registeredStaff.length > 0)
      ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`)
      : PRESET_STAFF_MEMBERS;

    const existingNames = new Set(teamMembersList.map(m => m.name));
    const candidate = staffName || staffPool.find(s => !existingNames.has(s)) || staffPool[0] || 'Plant Staff';
    const nextTask = PRESET_TASKS[teamMembersList.length % PRESET_TASKS.length];

    setTeamMembersList([...teamMembersList, { name: candidate, task: nextTask }]);
  };

  const handleRemoveMember = async (idx) => {
    if (teamMembersList.length <= 1) {
      alert('Please keep at least one staff member assigned.');
      return;
    }
    const removedMember = teamMembersList[idx];
    if (selectedAssignOrder && removedMember && removedMember.name) {
      const matchTask = packagingTasks.find(t => 
        t.orderId === selectedAssignOrder.id && 
        (t.staffMember?.toLowerCase().includes(removedMember.name.toLowerCase()) || 
         removedMember.name.toLowerCase().includes(t.staffMember?.toLowerCase()))
      );
      try {
        if (matchTask && matchTask.id) {
          await unassignPackagingTask(matchTask.id, token);
        }
        await unassignStaffFromOrder(selectedAssignOrder.id, removedMember.name, token, matchTask ? matchTask.id : null);
        loadOrders(true);
      } catch (err) {
        console.warn("Unassign on remove member warning:", err);
      }
    }
    setTeamMembersList(teamMembersList.filter((_, i) => i !== idx));
  };

  const handleUpdateMemberName = (idx, name) => {
    const updated = [...teamMembersList];
    updated[idx] = { ...updated[idx], name };
    setTeamMembersList(updated);
  };

  const handleUpdateMemberTask = (idx, task) => {
    const updated = [...teamMembersList];
    updated[idx] = { ...updated[idx], task };
    setTeamMembersList(updated);
  };

  const handleAssignSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAssignOrder) return;
    if (teamMembersList.length === 0) {
      alert('Please assign at least 1 plant staff member before saving.');
      return;
    }

    try {
      setSubmittingAssign(true);
      const teamMembersStr = teamMembersList.map(m => m.name.trim()).join(', ');
      const assignedTasksJson = JSON.stringify(
        teamMembersList.map(m => ({ member: m.name.trim(), task: m.task }))
      );

      await assignStaffToOrder(
        selectedAssignOrder.id,
        teamLeader,
        teamMembersStr,
        'In Production (PM Approved)',
        token,
        pmInstructions,
        teamMembersList[0]?.task || '',
        teamMembersList[1]?.task || '',
        teamMembersList[2]?.task || '',
        teamMembersList[3]?.task || '',
        assignedTasksJson
      );

      setToastMsg(`Order #${selectedAssignOrder.orderNumber}: Assigned ${teamMembersList.length} Staff Members & Tasks!`);
      setTimeout(() => setToastMsg(''), 4000);
      setSelectedAssignOrder(null);
      window.dispatchEvent(new Event('orders-updated'));
      loadOrders(true);
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
      setToastMsg(`Rejected process for Order #${selectedRejectOrder.orderNumber}. Reason: "${finalReason}"`);
      setTimeout(() => setToastMsg(''), 4000);
      setSelectedRejectOrder(null);
      window.dispatchEvent(new Event('orders-updated'));
      loadOrders(true);
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
      setToastMsg(`Order #${selectedProgressOrder.orderNumber} Process Progress Updated to ${progressValue}% ("${statusStage}")!`);
      setTimeout(() => setToastMsg(''), 4000);
      setSelectedProgressOrder(null);
      window.dispatchEvent(new Event('orders-updated'));
      loadOrders(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleDeleteOrder = async (orderId, orderNum) => {
    if (!window.confirm(`Are you sure you want to delete Scheduled Production Order #${orderNum}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteOrder(orderId, token);
      setToastMsg(`Scheduled Production Order #${orderNum} deleted successfully!`);
      setTimeout(() => setToastMsg(''), 4000);
      window.dispatchEvent(new Event('orders-updated'));
      loadOrders(true);
    } catch (err) {
      alert(err.message || 'Failed to delete order.');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading Packaging Manager Dashboard...</div>;
  }

  // Production Orders filtering: ONLY orders where Admin assigned startDate and endDate and not waiting for customer deadline
  const productionOrders = orders.filter(o => {
    if (!o || !o.status) return false;
    const st = o.status.toLowerCase();
    if (st === 'pending' || st === 'denied' || st === 'rejected' || st.includes('waiting for customer')) return false;
    return Boolean(o.startDate && o.endDate);
  });

  const filteredProductionOrders = productionOrders.filter(o => {
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

  const activeCount = productionOrders.filter(o => o.status !== 'Completed' && o.status !== 'Rejected by PM').length;
  const approvedCount = productionOrders.filter(o => o.assignedStaff || o.status?.includes('PM Approved')).length;
  const rejectedCount = orders.filter(o => o.status === 'Rejected by PM').length;

  const getDaysUntilDeadline = (order) => {
    const deadlineStr = order.endDate || order.targetDeadline || order.deadline;
    if (!deadlineStr) return null;
    const deadlineDate = new Date(deadlineStr);
    if (isNaN(deadlineDate.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const urgentDeadlineOrders = productionOrders.filter(o => {
    if (!o || o.status === 'Completed' || o.status === 'Rejected by PM') return false;
    const days = getDaysUntilDeadline(o);
    return days !== null && days >= 0 && days <= 7;
  });

  const urgentTotalQuantity = urgentDeadlineOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="card-rounded" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
        color: '#FFFFFF',
        borderRadius: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            <Layers size={16} />
            <span>Packaging & Plant Operations Manager</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>Packaging Production Dashboard</h1>
        </div>
      </div>

      {toastMsg && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '0.75rem', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Production Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Active Production Orders</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#D97706', marginTop: '0.5rem' }}>{activeCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>Scheduled with Start/End dates</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Approved & Team Assigned</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#059669', marginTop: '0.5rem' }}>{approvedCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.2rem' }}>Leader & 4 members set</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>PM Rejected Processes</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#DC2626', marginTop: '0.5rem' }}>{rejectedCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '0.2rem' }}>Staff or resource shortage</div>
        </div>

        {/* 4th Stat Card: Approaching Deadlines Order Quantity (Clickable) */}
        <div
          onClick={() => setShowUrgentModal(true)}
          className="card-rounded"
          style={{
            padding: '1.25rem',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            border: '1px solid #FDBA74',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.12)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '0.85rem', color: '#C2410C', fontWeight: '800' }}>
            <span>Urgent Deadlines (≤ 7 Days)</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#C2410C', marginTop: '0.4rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            {urgentTotalQuantity.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#9A3412' }}>Units ({urgentDeadlineOrders.length} Orders)</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#EA580C', marginTop: '0.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} /> Click to inspect urgent order details &rarr;
          </div>
        </div>
      </div>

      {/* Scheduled Plant Production Orders Section */}
      <div className="card-rounded" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={20} style={{ color: '#D97706' }} />
              <span>Scheduled Plant Production Orders ({filteredProductionOrders.length})</span>
            </h3>

          </div>

          <div style={{ position: 'relative', minWidth: '260px' }}>
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

        {filteredProductionOrders.length === 0 ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
            <Package size={36} style={{ color: '#94A3B8', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: '700', color: '#0F172A' }}>No scheduled production orders found</div>
            <div style={{ fontSize: '0.85rem' }}>Orders with assigned start and end dates will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredProductionOrders.map(o => {
              const isPMApproved = Boolean((o.teamMembers || o.assignedStaff) && (o.status?.includes('PM Approved') || o.teamLeader));
              const isPMRejected = o.status === 'Rejected by PM' || o.status === 'Denied';
              const currentProgress = o.progressPercentage || 0;

              return (
                <div key={o.id} style={{
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: isPMRejected ? '1px solid #FCA5A5' : isPMApproved ? '1px solid #A7F3D0' : '1px solid #FCD34D',
                  backgroundColor: isPMRejected ? '#FEF2F2' : isPMApproved ? '#F0FDF4' : '#FFFBEB',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  {/* Top Bar: Order details & Status Badge & Delete Icon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: '800', color: '#0F4C81', fontSize: '1.05rem', marginRight: '0.75rem' }}>#{o.orderNumber}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A' }}>{o.packagingType} ({o.quantity?.toLocaleString()} units)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '99px',
                        backgroundColor: isPMRejected ? '#FEE2E2' : isPMApproved ? '#D1FAE5' : '#FEF3C7',
                        color: isPMRejected ? '#DC2626' : isPMApproved ? '#047857' : '#D97706',
                        fontSize: '0.8rem',
                        fontWeight: '800'
                      }}>
                        {o.status}
                      </span>

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
                          fontWeight: '800',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    <strong>Customer:</strong> {o.customerName} ({o.customerEmail}) &bull; <strong>Dimensions:</strong> {o.dimensions} &bull; <strong>Finish:</strong> {o.printFinish || 'N/A'}
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


                  {/* Scheduled Dates Banner */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                    <div><span style={{ color: '#64748B' }}>Assigned PM:</span> <strong style={{ color: '#D97706', display: 'block' }}>{o.assignedManager || 'Pending PM Assignment'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Start Date:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{o.startDate || 'TBD'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>End Date / Deadline:</span> <strong style={{ color: '#059669', display: 'block' }}>{o.endDate || o.targetDeadline || 'TBD'}</strong></div>
                  </div>

                  {/* Process Progress Bar & Edit Button */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '0.65rem', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', fontWeight: '700' }}>
                      <span style={{ color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <PlayCircle size={16} style={{ color: '#D97706' }} /> Process Stage: <span style={{ color: '#D97706' }}>{o.status}</span>
                      </span>
                      <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.15rem 0.6rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800' }}>
                        {currentProgress}% Completed
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${currentProgress}%`,
                        height: '100%',
                        backgroundColor: currentProgress === 100 ? '#10B981' : currentProgress >= 75 ? '#059669' : currentProgress >= 50 ? '#D97706' : '#F59E0B',
                        borderRadius: '99px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>

                  {/* Rejection notice if rejected */}
                  {isPMRejected && (
                    <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.75rem 1rem', borderRadius: '0.65rem', fontSize: '0.85rem', color: '#991B1B' }}>
                      <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <ShieldAlert size={18} /> Process Rejected / Declined
                      </div>
                      <div><strong>Reason:</strong> &ldquo;{o.rejectionReason || 'Specification declined or insufficient capacity'}&rdquo;</div>
                    </div>
                  )}

                  {/* Staff Team Card & Action Buttons */}
                  {isPMApproved && !isPMRejected ? (
                    <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.85rem 1rem', borderRadius: '0.65rem', fontSize: '0.825rem', color: '#047857', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: '#065F46' }}>
                            <Users size={17} /> Team Leader: {o.teamLeader || 'Kasun (Die-Cutting Lead)'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleOpenProgressModal(o)}
                            style={{ padding: '0.45rem 0.75rem', borderRadius: '0.45rem', border: 'none', backgroundColor: '#D97706', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Percent size={14} /> Edit Process Progress (0-100%)
                          </button>
                          <button
                            onClick={() => handleOpenAssignModal(o)}
                            style={{ padding: '0.45rem 0.75rem', borderRadius: '0.45rem', border: '1px solid #A7F3D0', backgroundColor: '#FFFFFF', color: '#047857', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Edit Team & Member Tasks
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(o)}
                            style={{ padding: '0.45rem 0.75rem', borderRadius: '0.45rem', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Reject Process
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Assigned Members & Tasks Grid */}
                      {(() => {
                        const orderTasksFromDb = packagingTasks.filter(t => t.orderId === o.id);
                        const assignedTasks = orderTasksFromDb.length > 0
                          ? orderTasksFromDb.filter(t => (t.status || '').toLowerCase() === 'assigned' || (t.status || '').toLowerCase() === 'assign')
                          : getOrderTasks(o).map((item, idx) => ({ id: `temp-${idx}`, staffMember: item.member, taskDescription: item.task, status: 'Assigned' }));
                        const unassignedTasks = orderTasksFromDb.filter(t => (t.status || '').toLowerCase() === 'unassigned' || (t.status || '').toLowerCase() === 'unassign');

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.55rem', backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #A7F3D0' }}>
                              {assignedTasks.length > 0 ? (
                                assignedTasks.map((item, tIdx) => (
                                  <div key={item.id || tIdx} style={{ backgroundColor: '#F0FDF4', padding: '0.55rem 0.65rem', borderRadius: '0.45rem', border: '1px solid #BBF7D0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.4rem' }}>
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <div style={{ fontWeight: '800', color: '#065F46', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <CheckSquare size={13} style={{ color: '#059669', flexShrink: 0 }} />
                                          <span>Staff #{tIdx + 1}: {item.staffMember || item.member}</span>
                                        </div>
                                        <span style={{ fontSize: '0.675rem', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#059669', padding: '0.1rem 0.45rem', borderRadius: '99px', border: '1px solid #86EFAC' }}>
                                          Assigned
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                                        <strong>Task:</strong> {item.taskDescription || item.task}
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.15rem' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickUnassign(o.id, item.staffMember || item.member, item.id)}
                                        title="Unassign this staff member and change status to Unassigned in database"
                                        style={{
                                          padding: '0.2rem 0.55rem',
                                          borderRadius: '0.35rem',
                                          border: '1px solid #FECACA',
                                          backgroundColor: '#FEF2F2',
                                          color: '#DC2626',
                                          fontSize: '0.7rem',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <UserMinus size={11} /> Unassign
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic', padding: '0.25rem' }}>
                                  No active staff members assigned yet.
                                </div>
                              )}
                            </div>

                            {/* Unassigned Staff Tasks Section for this Order */}
                            {unassignedTasks.length > 0 && (
                              <div style={{ backgroundColor: '#FFFBEB', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px dashed #FCD34D' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                                  <Clock size={13} style={{ color: '#D97706' }} />
                                  <span>Unassigned Staff Tasks in Database ({unassignedTasks.length}):</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                  {unassignedTasks.map((uTask, uIdx) => (
                                    <div key={uTask.id || uIdx} style={{ backgroundColor: '#FFFFFF', border: '1px solid #FDE68A', padding: '0.35rem 0.55rem', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                                      <div>
                                        <strong style={{ color: '#92400E' }}>{uTask.staffMember}</strong>
                                        <span style={{ fontSize: '0.65rem', backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.05rem 0.35rem', borderRadius: '99px', marginLeft: '0.3rem', fontWeight: '800' }}>
                                          Unassigned
                                        </span>
                                        <div style={{ fontSize: '0.7rem', color: '#78350F' }}>{uTask.taskDescription}</div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickAssign(o.id, uTask.staffMember, uTask.taskDescription, uTask.id)}
                                        style={{
                                          padding: '0.2rem 0.5rem',
                                          borderRadius: '0.35rem',
                                          border: '1px solid #86EFAC',
                                          backgroundColor: '#F0FDF4',
                                          color: '#059669',
                                          fontSize: '0.7rem',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.2rem'
                                        }}
                                      >
                                        <RotateCcw size={11} /> Re-assign
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}


                      {o.pmInstructions && (
                        <div style={{ fontSize: '0.775rem', color: '#065F46', backgroundColor: '#FFFFFF', padding: '0.4rem 0.65rem', borderRadius: '0.4rem', border: '1px dashed #A7F3D0' }}>
                          <strong>PM Overall Production Instructions:</strong> &ldquo;{o.pmInstructions}&rdquo;
                        </div>
                      )}
                    </div>
                  ) : !isPMRejected ? (
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.85rem 1rem', borderRadius: '0.65rem', fontSize: '0.825rem', color: '#92400E', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={18} /> Action Required: PM must assign Plant Team & Individual Staff Tasks.
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleOpenAssignModal(o)}
                          style={{ padding: '0.5rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontSize: '0.825rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <UserCheck size={15} /> Assign Staff Members & Tasks
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
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* MODAL: PM ASSIGN DYNAMIC STAFF TEAM & INDIVIDUAL TASKS */}

      {selectedAssignOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card-rounded" style={{ background: '#FFFFFF', padding: '1.75rem 2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '680px', border: '1px solid #E2E8F0', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#D97706', backgroundColor: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: '0.35rem' }}>
                  Order #{selectedAssignOrder.orderNumber}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginTop: '0.35rem', marginBottom: 0 }}>
                  Assign Plant Staff & Production Tasks
                </h3>
              </div>
              <button onClick={() => setSelectedAssignOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <XCircle size={22} />
              </button>
            </div>

            {/* Spec info badge */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.65rem', border: '1px solid #E2E8F0', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div><strong>Packaging Spec:</strong> {selectedAssignOrder.packagingType} ({selectedAssignOrder.quantity?.toLocaleString()} units)</div>
                <div><strong>Customer:</strong> {selectedAssignOrder.customerName}</div>
              </div>
              <div style={{ marginTop: '0.25rem', color: '#64748B' }}><strong>Scheduled Dates:</strong> {selectedAssignOrder.startDate} to {selectedAssignOrder.endDate}</div>
            </div>

            {/* Two-Stage Flow Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', backgroundColor: '#F1F5F9', padding: '0.35rem', borderRadius: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setAssignStep(1)}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: assignStep === 1 ? '#FFFFFF' : 'transparent',
                  color: assignStep === 1 ? '#0F172A' : '#64748B',
                  fontWeight: assignStep === 1 ? '800' : '600',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  boxShadow: assignStep === 1 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: assignStep === 1 ? '#0F4C81' : '#94A3B8',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: '800'
                }}>1</span>
                1. Select Plant Employees ({teamMembersList.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  if (teamMembersList.length === 0) {
                    alert('Please select at least 1 plant staff member first.');
                    return;
                  }
                  setAssignStep(2);
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: assignStep === 2 ? '#FFFFFF' : 'transparent',
                  color: assignStep === 2 ? '#0F172A' : '#64748B',
                  fontWeight: assignStep === 2 ? '800' : '600',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  boxShadow: assignStep === 2 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: assignStep === 2 ? '#059669' : '#94A3B8',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: '800'
                }}>2</span>
                2. Assign Tasks to Each ({teamMembersList.length})
              </button>
            </div>

            {/* STAGE 1: SELECT EMPLOYEES FIRST */}
            {assignStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* 1. Group Leader */}
                <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', padding: '0.85rem', borderRadius: '0.65rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <UserCheck size={16} /> 1. Select Plant Group Leader
                  </label>
                  <select
                    value={teamLeader}
                    onChange={(e) => setTeamLeader(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #7DD3FC', fontSize: '0.875rem', fontWeight: '700', backgroundColor: '#FFFFFF', color: '#0F172A' }}
                  >
                    {((registeredStaff && registeredStaff.length > 0 ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`) : PRESET_STAFF_MEMBERS)).map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Assign Any Number of Staff Members */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={16} /> 2. Assign Plant Staff Members ({teamMembersList.length} Assigned)
                      </label>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                        Assign any number of employees for this production order.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddMember()}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.45rem',
                        backgroundColor: '#ECFDF5',
                        border: '1px solid #6EE7B7',
                        color: '#047857',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Plus size={14} /> + Add Employee
                    </button>
                  </div>

                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.45rem 0.65rem', borderRadius: '0.45rem', fontSize: '0.75rem', color: '#047857', marginBottom: '0.65rem' }}>
                    <strong>Table status transition:</strong> Removing an employee marks their record as <span style={{ color: '#DC2626', fontWeight: '800' }}>Unassigned</span> in the <code>packaing_tasks</code> table. Adding or keeping an employee marks their record as <span style={{ color: '#059669', fontWeight: '800' }}>Assigned</span>.
                  </div>

                  {/* List of Dynamic Staff Members */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {teamMembersList.map((m, idx) => {
                      const staffPool = registeredStaff && registeredStaff.length > 0
                        ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`)
                        : PRESET_STAFF_MEMBERS;
                      const options = m.name && !staffPool.includes(m.name) ? [m.name, ...staffPool] : staffPool;

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            backgroundColor: '#F8FAFC',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '0.55rem',
                            border: '1px solid #E2E8F0'
                          }}
                        >
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: '#E2E8F0',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            flexShrink: 0
                          }}>
                            #{idx + 1}
                          </span>

                          <div style={{ flex: 1 }}>
                            <select
                              value={m.name}
                              onChange={(e) => handleUpdateMemberName(idx, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.65rem',
                                borderRadius: '0.45rem',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                backgroundColor: '#FFFFFF',
                                color: '#0F172A'
                              }}
                            >
                              {options.map((st, sIdx) => (
                                <option key={sIdx} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            title="Remove employee"
                            style={{
                              padding: '0.45rem',
                              borderRadius: '0.4rem',
                              border: '1px solid #FECACA',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Add Pills */}
                  {(() => {
                    const staffPool = registeredStaff && registeredStaff.length > 0
                      ? registeredStaff.map(s => `${s.fullName} (${s.roleSpecialty || s.department || 'Staff'})`)
                      : PRESET_STAFF_MEMBERS;
                    const existingSet = new Set(teamMembersList.map(m => m.name));
                    const unassignedStaff = staffPool.filter(s => !existingSet.has(s));
                    if (unassignedStaff.length === 0) return null;

                    return (
                      <div style={{ marginTop: '0.75rem', padding: '0.55rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px dashed #CBD5E1' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '0.35rem' }}>
                          Quick Add Available Staff:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {unassignedStaff.slice(0, 6).map((staffName, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => handleAddMember(staffName)}
                              style={{
                                padding: '0.25rem 0.55rem',
                                borderRadius: '99px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: '#334155',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Plus size={11} style={{ color: '#059669' }} /> {staffName.split('(')[0].trim()}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Previously Unassigned Staff from packaing_tasks table */}
                  {(() => {
                    const unassignedForOrder = packagingTasks.filter(
                      t => t.orderId === selectedAssignOrder?.id && ((t.status || '').toLowerCase() === 'unassigned' || (t.status || '').toLowerCase() === 'unassign')
                    );
                    const currentNames = new Set(teamMembersList.map(m => (m.name || '').toLowerCase().trim()));
                    const availableToReadd = unassignedForOrder.filter(t => !currentNames.has((t.staffMember || '').toLowerCase().trim()));
                    if (availableToReadd.length === 0) return null;

                    return (
                      <div style={{ marginTop: '0.75rem', padding: '0.55rem 0.75rem', backgroundColor: '#FFFBEB', borderRadius: '0.5rem', border: '1px dashed #FCD34D' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                          <Clock size={12} /> Previously Unassigned Staff in Table:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {availableToReadd.map((uTask, uIdx) => (
                            <button
                              key={uIdx}
                              type="button"
                              onClick={() => handleAddMember(uTask.staffMember)}
                              style={{
                                padding: '0.25rem 0.55rem',
                                borderRadius: '99px',
                                border: '1px solid #FCD34D',
                                backgroundColor: '#FFFFFF',
                                color: '#92400E',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <RotateCcw size={11} style={{ color: '#D97706' }} /> Re-assign {uTask.staffMember.split('(')[0].trim()}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>


                {/* Footer Buttons for Step 1 */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedAssignOrder(null)}
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (teamMembersList.length === 0) {
                        alert('Please assign at least 1 staff member.');
                        return;
                      }
                      setAssignStep(2);
                    }}
                    style={{
                      flex: 1.8,
                      padding: '0.65rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    Next: Assign Tasks to {teamMembersList.length} Staff Member(s)
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: ASSIGN TASKS TO EACH EMPLOYEE */}
            {assignStep === 2 && (
              <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '0.825rem', color: '#065F46', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#059669' }} /> Assign individual packaging task to each staff member:
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignStep(1)}
                    style={{ border: 'none', background: 'transparent', color: '#047857', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Modify Employees ({teamMembersList.length})
                  </button>
                </div>

                {/* Individual Task Cards for Each Selected Employee */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '42vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {teamMembersList.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#F0FDF4',
                        padding: '0.85rem',
                        borderRadius: '0.65rem',
                        border: '1px solid #A7F3D0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <div style={{ fontWeight: '800', color: '#065F46', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={15} style={{ color: '#059669' }} /> Staff #{idx + 1}: {m.name}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#047857', backgroundColor: '#DCFCE7', padding: '0.15rem 0.45rem', borderRadius: '99px' }}>
                          Task Assignment
                        </span>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#047857', display: 'block', marginBottom: '0.25rem' }}>
                          Select Pre-Defined Packaging Task:
                        </label>
                        <select
                          value={m.task}
                          onChange={(e) => handleUpdateMemberTask(idx, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.55rem 0.65rem',
                            borderRadius: '0.45rem',
                            border: '1px solid #6EE7B7',
                            fontSize: '0.825rem',
                            backgroundColor: '#FFFFFF',
                            color: '#065F46',
                            fontWeight: '600'
                          }}
                        >
                          {PRESET_TASKS.map((tsk, tIdx) => (
                            <option key={tIdx} value={tsk}>{tsk}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PM Production Instructions */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <FileText size={16} /> PM Overall Production Instructions for Team
                  </label>
                  <textarea
                    rows="3"
                    value={pmInstructions}
                    onChange={(e) => setPmInstructions(e.target.value)}
                    placeholder="Enter overall plant execution instructions for group..."
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                {/* Footer Buttons for Step 2 */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setAssignStep(1)}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #CBD5E1',
                      background: '#F1F5F9',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft size={15} /> Back to Employees
                  </button>

                  <button
                    type="submit"
                    disabled={submittingAssign}
                    className="btn-primary"
                    style={{
                      flex: 1.8,
                      padding: '0.65rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      border: 'none',
                      cursor: submittingAssign ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Check size={16} />
                    {submittingAssign ? 'Saving Team & Tasks...' : `Confirm & Save ${teamMembersList.length} Staff Tasks`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PM REJECT PROCESS */}
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
              Specify the reason for rejecting this packaging process.
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

      {/* MODAL: URGENT / APPROACHING DEADLINES DETAIL VIEW */}
      {showUrgentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
          <div className="card-rounded" style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.25rem', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ backgroundColor: '#FFEDD5', padding: '0.5rem', borderRadius: '0.5rem', color: '#EA580C' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#9A3412', margin: 0 }}>
                    Orders with Approaching Deadlines (Within 7 Days)
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                    Total Quantity: <strong style={{ color: '#EA580C' }}>{urgentTotalQuantity.toLocaleString()} Units</strong> across <strong>{urgentDeadlineOrders.length} Orders</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowUrgentModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '0.25rem' }}>
                <XCircle size={24} />
              </button>
            </div>

            {/* List of Urgent Orders */}
            {urgentDeadlineOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                <CheckCircle2 size={40} style={{ color: '#059669', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>No Urgent Deadlines Approaching!</div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>All active orders have deadlines further than 7 days out.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {urgentDeadlineOrders.map(order => {
                  const daysLeft = getDaysUntilDeadline(order);
                  let badgeBg = '#FEF3C7';
                  let badgeText = '#92400E';
                  let badgeLabel = `🕒 Due in ${daysLeft} days`;

                  if (daysLeft < 0) {
                    badgeBg = '#FEE2E2';
                    badgeText = '#991B1B';
                    badgeLabel = `🚨 Overdue by ${Math.abs(daysLeft)} days!`;
                  } else if (daysLeft === 0) {
                    badgeBg = '#FEE2E2';
                    badgeText = '#991B1B';
                    badgeLabel = `🚨 Due Today!`;
                  } else if (daysLeft <= 3) {
                    badgeBg = '#FFEDD5';
                    badgeText = '#C2410C';
                    badgeLabel = `⚠️ Due in ${daysLeft} days!`;
                  }

                  return (
                    <div key={order.id} style={{ backgroundColor: '#FAFAFA', border: '1px solid #E2E8F0', padding: '1rem 1.25rem', borderRadius: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A' }}>
                            Order #{order.orderNumber}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', backgroundColor: badgeBg, color: badgeText, padding: '0.25rem 0.6rem', borderRadius: '99px' }}>
                            {badgeLabel}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                          Customer: <strong>{order.customerName || 'Direct Customer'}</strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                          Spec: <strong>{order.packagingType}</strong> ({order.dimensions || `${order.lengthMm}x${order.widthMm}x${order.heightMm} mm`}) • Material: {order.material || 'Kraft'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#0F4C81', fontWeight: '700', marginTop: '0.25rem' }}>
                          Target End Date: <span style={{ color: '#EA580C' }}>{order.endDate || order.targetDeadline || 'N/A'}</span> (Start: {order.startDate || 'N/A'})
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Order Quantity</span>
                          <strong style={{ fontSize: '1.25rem', color: '#D97706' }}>{Number(order.quantity || 0).toLocaleString()} Units</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            title="Delete Scheduled Production Order"
                            style={{
                              padding: '0.45rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #FCA5A5',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.8rem',
                              fontWeight: '800',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                              e.currentTarget.style.borderColor = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEF2F2';
                              e.currentTarget.style.borderColor = '#FCA5A5';
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowUrgentModal(false);
                              handleOpenAssignModal(order);
                            }}
                            style={{ padding: '0.45rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                          >
                            <Users size={14} /> Assign Team & Tasks
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowUrgentModal(false)}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PM MANUALLY EDIT PROCESS PROGRESS */}
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
  );
}
