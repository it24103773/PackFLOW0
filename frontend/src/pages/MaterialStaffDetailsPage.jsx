import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { fetchInventory, fetchPackagingTasks } from '../services/api';
import {
  Warehouse,
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  RefreshCw,
  Layers,
  Boxes,
  ClipboardList
} from 'lucide-react';

export default function MaterialStaffDetailsPage() {
  const { token } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [packagingTasks, setPackagingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [materialSearch, setMaterialSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilterStatus, setTaskFilterStatus] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [invData, tasksData] = await Promise.all([
        fetchInventory().catch(() => []),
        fetchPackagingTasks(token).catch(() => [])
      ]);
      setMaterials(invData || []);
      setPackagingTasks(tasksData || []);
    } catch (err) {
      console.error('Failed to load material & staff details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Metrics Calculations
  const totalMaterials = materials.length;
  const inStockMaterials = materials.filter(m => (m.stockLevel || 0) > 0).length;
  const lowStockMaterials = materials.filter(m => {
    const purchased = m.purchasedStock && m.purchasedStock > 0 ? m.purchasedStock : ((m.stockLevel || 100) * 2);
    const available = m.stockLevel || 0;
    const pct = purchased > 0 ? (available / purchased) * 100 : 0;
    return pct < 20.0 || (m.reorderThreshold && available <= m.reorderThreshold) || available <= 0;
  }).length;

  const totalTasks = packagingTasks.length;
  const assignedTasksCount = packagingTasks.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'assigned' || s === 'assign';
  }).length;
  const unassignedTasksCount = packagingTasks.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'unassigned' || s === 'unassign';
  }).length;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          padding: '1.75rem 2rem',
          borderRadius: '1.25rem',
          color: '#FFFFFF',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', padding: '0.25rem 0.65rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              <ClipboardList size={13} />
              <span>Plant Operations & Resource Tracking</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#F59E0B' }}>
              Material and Staff Details
            </h1>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              padding: '0.6rem 1.1rem',
              borderRadius: '0.6rem',
              fontSize: '0.825rem',
              fontWeight: '700',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(4px)'
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* Quick KPI Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Card 1: Total Materials */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '0.75rem', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Warehouse size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Monitored Materials</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A' }}>{totalMaterials}</div>
              <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: '600' }}>{inStockMaterials} In Stock</div>
            </div>
          </div>

          {/* Card 2: Low Stock Alerts */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '0.75rem', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Low Stock Warnings</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: lowStockMaterials > 0 ? '#DC2626' : '#0F172A' }}>{lowStockMaterials}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Below 20% Threshold</div>
            </div>
          </div>

          {/* Card 3: Total Production Tasks */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '0.75rem', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Plant Production Tasks</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A' }}>{totalTasks}</div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600' }}>{assignedTasksCount} Assigned</div>
            </div>
          </div>

          {/* Card 4: Unassigned Tasks */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '0.75rem', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Unassigned Duties</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: unassignedTasksCount > 0 ? '#D97706' : '#0F172A' }}>{unassignedTasksCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Pending Staff Allocation</div>
            </div>
          </div>
        </div>

        {/* SECTION 1: RAW PACKAGING MATERIALS AVAILABLE STOCK MONITOR */}
        <div className="card-rounded" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Warehouse size={20} style={{ color: '#0F4C81' }} />
                <span>Raw Packaging Materials Available Stock Monitor</span>
              </h2>
            </div>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search stock material..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem 0.45rem 2rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Material Name</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Material Type</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Available Stock</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Total Purchased</th>
                  <th style={{ padding: '0.65rem 0.85rem', width: '170px' }}>Stock Percentage</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Availability Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                      Loading raw materials...
                    </td>
                  </tr>
                ) : materials.filter(m =>
                  m.name?.toLowerCase().includes(materialSearch.toLowerCase()) ||
                  m.category?.toLowerCase().includes(materialSearch.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                      No packaging materials found matching your search.
                    </td>
                  </tr>
                ) : (
                  materials.filter(m =>
                    m.name?.toLowerCase().includes(materialSearch.toLowerCase()) ||
                    m.category?.toLowerCase().includes(materialSearch.toLowerCase())
                  ).map(m => {
                    const purchased = m.purchasedStock && m.purchasedStock > 0 ? m.purchasedStock : ((m.stockLevel || 100) * 2);
                    const available = m.stockLevel || 0;
                    const pct = purchased > 0 ? Math.min(Math.max(Math.round(((available / purchased) * 100) * 10) / 10, 0), 100) : 0;
                    const isLow = pct < 20.0 || (m.reorderThreshold && available <= m.reorderThreshold) || available <= 0;

                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: '700', color: '#0F172A' }}>{m.name}</td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.4rem', backgroundColor: '#F1F5F9', color: '#334155', fontSize: '0.75rem', fontWeight: '600' }}>
                            {m.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: '800', color: isLow ? '#DC2626' : '#0F4C81' }}>
                          {available.toLocaleString()} {m.unit}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', color: '#64748B' }}>
                          {purchased.toLocaleString()} {m.unit}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '800', color: isLow ? '#DC2626' : '#334155' }}>
                              <span>{pct}%</span>
                              {isLow && <span style={{ color: '#DC2626', fontSize: '0.675rem' }}>LOW</span>}
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: isLow ? '#EF4444' : pct < 40 ? '#F59E0B' : '#10B981', borderRadius: '99px' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <span style={{
                            padding: '0.2rem 0.65rem',
                            borderRadius: '99px',
                            backgroundColor: available <= 0 ? '#FEE2E2' : isLow ? '#FEF2F2' : '#D1FAE5',
                            color: available <= 0 ? '#991B1B' : isLow ? '#991B1B' : '#065F46',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            {isLow && <AlertTriangle size={12} style={{ color: '#DC2626' }} />}
                            <span>{available <= 0 ? 'Out of Stock' : isLow ? 'Low Stock (<20%)' : 'Available'}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: PLANT STAFF & PRODUCTION TASKS */}
        <div className="card-rounded" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} style={{ color: '#0F4C81' }} />
                <span>Plant Staff & Production Tasks</span>
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {/* Status Filter Pills */}
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '0.5rem', gap: '0.25rem' }}>
                {['ALL', 'Assigned', 'Unassigned'].map((st) => {
                  const count = st === 'ALL'
                    ? packagingTasks.length
                    : packagingTasks.filter(t => (t.status || '').toLowerCase() === st.toLowerCase()).length;
                  const active = taskFilterStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTaskFilterStatus(st)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.35rem',
                        border: 'none',
                        backgroundColor: active ? '#FFFFFF' : 'transparent',
                        color: active ? '#0F172A' : '#64748B',
                        fontSize: '0.775rem',
                        fontWeight: active ? '800' : '600',
                        cursor: 'pointer',
                        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      {st === 'ALL' ? 'All Tasks' : st} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search Input */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search staff, task, order #..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem 0.45rem 2rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Packaging Tasks Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '0.65rem 0.75rem', width: '60px' }}>Task ID</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Order #</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Packaging Spec</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Plant Group Leader</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Staff Member</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Assigned Task Duty</th>
                  <th style={{ padding: '0.65rem 0.75rem', width: '130px' }}>Status in Table</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                      Loading plant tasks...
                    </td>
                  </tr>
                ) : (() => {
                  const filteredTasks = packagingTasks.filter(t => {
                    if (taskFilterStatus !== 'ALL') {
                      const normSt = (t.status || '').toLowerCase();
                      if (taskFilterStatus.toLowerCase() === 'assigned' && normSt !== 'assigned' && normSt !== 'assign') return false;
                      if (taskFilterStatus.toLowerCase() === 'unassigned' && normSt !== 'unassigned' && normSt !== 'unassign') return false;
                    }
                    if (!taskSearch.trim()) return true;
                    const q = taskSearch.toLowerCase().trim();
                    return (
                      (t.orderNumber && t.orderNumber.toLowerCase().includes(q)) ||
                      (t.staffMember && t.staffMember.toLowerCase().includes(q)) ||
                      (t.taskDescription && t.taskDescription.toLowerCase().includes(q)) ||
                      (t.teamLeader && t.teamLeader.toLowerCase().includes(q)) ||
                      (t.packagingType && t.packagingType.toLowerCase().includes(q)) ||
                      (t.status && t.status.toLowerCase().includes(q))
                    );
                  });

                  if (filteredTasks.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                          No packaging tasks found matching the filter.
                        </td>
                      </tr>
                    );
                  }

                  return filteredTasks.map(t => {
                    const isAssigned = (t.status || '').toLowerCase() === 'assigned' || (t.status || '').toLowerCase() === 'assign';

                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isAssigned ? '#FFFFFF' : '#FFFDF5' }}>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#64748B', fontWeight: '700' }}>#{t.id}</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: '800', color: '#0F4C81' }}>#{t.orderNumber}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#334155', fontWeight: '600' }}>{t.packagingType}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#64748B' }}>{t.teamLeader || 'N/A'}</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700', color: '#0F172A' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <User size={13} style={{ color: isAssigned ? '#059669' : '#D97706' }} />
                            {t.staffMember}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#475569', maxWidth: '320px' }}>
                          {t.taskDescription || 'Packaging duty'}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '99px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            backgroundColor: isAssigned ? '#D1FAE5' : '#FEF3C7',
                            color: isAssigned ? '#047857' : '#B45309',
                            border: isAssigned ? '1px solid #A7F3D0' : '1px solid #FDE68A'
                          }}>
                            {isAssigned ? (
                              <><CheckCircle2 size={12} /> Assigned</>
                            ) : (
                              <><Clock size={12} /> Unassigned</>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
