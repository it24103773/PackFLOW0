import React, { useState, useEffect } from 'react';
import {
  fetchDashboardStats,
  fetchActivities,
  fetchOrders,
  fetchInventory
} from '../../services/api';
import AnnouncementsSidebar from './AnnouncementsSidebar';
import AdminFeedbackPanel from './AdminFeedbackPanel';
import OrderHistoryTable from './OrderHistoryTable';
import {
  Box,
  ShoppingCart,
  Users,
  Truck,
  Activity,
  ShieldCheck,
  Clock,
  Ruler,
  ExternalLink,
  AlertTriangle,
  BarChart3,
  AlertOctagon,
  TrendingUp,
  Percent,
  Megaphone,
  MessageSquare,
  History
} from 'lucide-react';

export default function AdminDashboard({ user, token }) {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState('overview'); // 'overview', 'announcements', 'feedbacks', 'history'

  useEffect(() => {
    loadData();
    const interval = setInterval(loadDataSilent, 3000);
    const handleOrdersEvent = () => loadDataSilent();
    const handleInventoryEvent = () => loadDataSilent();
    const handleFocus = () => loadDataSilent();

    window.addEventListener('orders-updated', handleOrdersEvent);
    window.addEventListener('inventory-updated', handleInventoryEvent);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('orders-updated', handleOrdersEvent);
      window.removeEventListener('inventory-updated', handleInventoryEvent);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, act, ord, inv] = await Promise.all([
        fetchDashboardStats(),
        fetchActivities(),
        fetchOrders(),
        fetchInventory().catch(() => [])
      ]);
      setStats(s);
      setActivities(act);
      setOrders(ord || []);
      setInventory(inv || []);
    } catch (e) {
      console.error('Error loading admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadDataSilent = async () => {
    try {
      const [s, act, ord, inv] = await Promise.all([
        fetchDashboardStats(),
        fetchActivities(),
        fetchOrders(),
        fetchInventory().catch(() => [])
      ]);
      setStats(s);
      setActivities(act);
      setOrders(ord || []);
      setInventory(inv || []);
    } catch (e) {
      console.error('Error refreshing admin stats silently:', e);
    }
  };

  // Order Progress Health Calculations
  const totalOrdersCount = orders.length;

  const declinedOrdersCount = orders.filter(o => {
    const st = (o.status || '').toLowerCase();
    return st === 'denied' || st.includes('rejected');
  }).length;

  const activeOrdersCount = orders.filter(o => {
    const st = (o.status || '').toLowerCase();
    return st !== 'denied' && !st.includes('rejected') && st !== 'completed';
  }).length;

  // Calculate sum of order progress percentages where declined orders contribute 0%
  const totalProgressSum = orders.reduce((sum, order) => {
    const st = (order.status || '').toLowerCase();
    if (st === 'denied' || st.includes('rejected')) {
      return sum + 0;
    }
    return sum + (order.progressPercentage !== undefined && order.progressPercentage !== null ? Number(order.progressPercentage) : 0);
  }, 0);

  const orderProgressPct = totalOrdersCount > 0 ? Math.round(totalProgressSum / totalOrdersCount) : 0;

  // Percentage Range Mappings:
  // below 10%: risk (red)
  // 10-20%: weak (red)
  // 20-50%: average (yellow)
  // above 50%: peak (green)
  const getHealthInfo = (pct) => {
    if (pct < 10) {
      return {
        status: 'Risk',
        label: 'Risk',
        color: '#EF4444',
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        progressColor: '#EF4444',
        Icon: AlertOctagon
      };
    } else if (pct < 20) {
      return {
        status: 'Weak',
        label: 'Weak',
        color: '#EA580C',
        bgColor: '#FFF7ED',
        borderColor: '#FFEDD5',
        progressColor: '#F97316',
        Icon: AlertTriangle
      };
    } else if (pct <= 50) {
      return {
        status: 'Average',
        label: 'Average',
        color: '#D97706',
        bgColor: '#FEF3C7',
        borderColor: '#FCD34D',
        progressColor: '#F59E0B',
        Icon: Activity
      };
    } else {
      return {
        status: 'Peak',
        label: 'Peak',
        color: '#059669',
        bgColor: '#D1FAE5',
        borderColor: '#6EE7B7',
        progressColor: '#10B981',
        Icon: TrendingUp
      };
    }
  };

  const healthInfo = getHealthInfo(orderProgressPct);
  const HealthIcon = healthInfo.Icon;

  // Inventory Low Stock Count Calculation
  const lowStockCount = inventory && inventory.length > 0
    ? inventory.filter(item => {
      const purchased = item.purchasedStock && item.purchasedStock > 0 ? item.purchasedStock : 100;
      const available = item.stockLevel !== undefined && item.stockLevel !== null ? item.stockLevel : 0;
      const pct = (available / purchased) * 100;
      const status = (item.status || '').toLowerCase();
      return (
        status === 'low stock' ||
        status === 'out of stock' ||
        available <= 0 ||
        (item.reorderThreshold !== null && item.reorderThreshold !== undefined && available <= item.reorderThreshold) ||
        pct < 20.0
      );
    }).length
    : (stats?.lowStockAlerts ?? 0);

  // Urgent Deadlines (≤ 7 Days) Calculation for Scheduled Production Orders
  const getDaysUntilDeadline = (order) => {
    const deadlineStr = order.endDate || order.targetDeadline;
    if (!deadlineStr) return null;
    const deadlineDate = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const urgentDeadlineOrders = orders.filter(o => {
    if (!o || !o.startDate || !o.endDate) return false;
    const st = (o.status || '').toLowerCase();
    if (st === 'completed' || st === 'denied' || st === 'rejected by pm' || st.includes('rejected') || st.includes('waiting for customer')) return false;
    const days = getDaysUntilDeadline(o);
    return days !== null && days >= 0 && days <= 7;
  });

  const urgentDeadlinesCount = urgentDeadlineOrders.length;

  // Newest activities first
  const sortedActivities = [...activities].sort((a, b) => {
    if (b.id && a.id) return b.id - a.id;
    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
  });

  const formatActivityTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp.replace('T', ' ').substring(0, 16);
      const now = new Date();
      const diffSec = Math.floor((now - d) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 7) return `${diffDay}d ago`;
      return timestamp.replace('T', ' ').substring(0, 16);
    } catch {
      return timestamp.replace('T', ' ').substring(0, 16);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading System Overview...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Minimalist Top Banner */}
      <div className="card-rounded" style={{
        padding: '1.75rem 2rem',
        background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A8A 100%)',
        color: '#FFFFFF',
        borderRadius: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.3rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            <ShieldCheck size={15} style={{ color: '#F59E0B' }} />
            <span>System Administration Overview</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>System Control Center</h1>
        </div>
      </div>

      {/* Minimalist Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
            <span>Product Masters</span>
            <Box size={20} style={{ color: '#0F4C81' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>{stats?.totalProducts || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.2rem' }}>Master catalog items</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
            <span>3rd-Party Products</span>
            <ExternalLink size={20} style={{ color: '#F59E0B' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>{stats?.totalThirdPartyProducts || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#D97706', marginTop: '0.2rem' }}>Registered records</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
            <span>Packaging Types</span>
            <Ruler size={20} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>{stats?.totalPackagingTypes || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.2rem' }}>Dimension constraints set</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
            <span>Customer Orders</span>
            <ShoppingCart size={20} style={{ color: '#3730A3' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>{stats?.totalOrders || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#3730A3', marginTop: '0.2rem' }}>{stats?.activeOrders || 0} active</div>
        </div>

        {/* Ongoing Order Progress Stat Card */}
        <div className="card-rounded" style={{
          padding: '1.25rem',
          background: '#FFFFFF',
          border: `1.5px solid ${healthInfo.borderColor}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BarChart3 size={18} style={{ color: healthInfo.color }} />
              <span>Orders Progress</span>
            </span>
            {/* Non-button Clean Status Indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: healthInfo.color,
              fontSize: '0.775rem',
              fontWeight: '800'
            }}>
              <HealthIcon size={13} />
              <span>{healthInfo.label}</span>
            </div>
          </div>

          {/* Centered Large Circular Progress Chart */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.4rem 0 0.2rem 0'
          }}>
            <div style={{ position: 'relative', width: '124px', height: '124px' }}>
              <svg width="124" height="124" viewBox="0 0 124 124" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="orderProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={healthInfo.progressColor} />
                    <stop offset="100%" stopColor={healthInfo.color} />
                  </linearGradient>
                </defs>
                {/* Background Ring Track */}
                <circle
                  cx="62"
                  cy="62"
                  r="50"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="9.5"
                />
                {/* Dynamic Animated Progress Ring */}
                <circle
                  cx="62"
                  cy="62"
                  r="50"
                  fill="none"
                  stroke="url(#orderProgressGrad)"
                  strokeWidth="9.5"
                  strokeLinecap="round"
                  strokeDasharray={314.16}
                  strokeDashoffset={314.16 * (1 - Math.min(100, Math.max(0, orderProgressPct)) / 100)}
                  transform="rotate(-90 62 62)"
                  style={{
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </svg>

              {/* Centered Percentage & Status Inside Circle */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <span style={{
                  fontSize: '1.85rem',
                  fontWeight: '900',
                  color: '#0F172A',
                  lineHeight: 1,
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  {orderProgressPct}%
                </span>
                <span style={{
                  fontSize: '0.725rem',
                  fontWeight: '800',
                  color: healthInfo.color,
                  marginTop: '0.3rem',
                  lineHeight: 1
                }}>
                  {healthInfo.status} Level
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: '#64748B', fontWeight: '600', paddingTop: '0.3rem', borderTop: '1px solid #F1F5F9' }}>
            <span>Ongoing: <strong style={{ color: '#0F172A' }}>{activeOrdersCount}</strong></span>
            <span>Declined: <strong style={{ color: '#EF4444' }}>{declinedOrdersCount}</strong></span>
            <span>Total: <strong style={{ color: '#0F172A' }}>{totalOrdersCount}</strong></span>
          </div>
        </div>

        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
            <span>Inventory Alerts</span>
            <AlertTriangle size={20} style={{ color: '#EF4444' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>
            {lowStockCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.2rem' }}>Low stock items</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
            <span>Registered Suppliers</span>
            <Truck size={20} style={{ color: '#8B5CF6' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>
            {stats?.totalSuppliers ?? 2}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8B5CF6', marginTop: '0.2rem' }}>Material partners</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
            <span>Urgent Deadlines</span>
            <Clock size={20} style={{ color: '#EA580C' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>
            {urgentDeadlinesCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#EA580C', marginTop: '0.2rem' }}>Due within 7 days</div>
        </div>
      </div>

      {/* System Activity Log Stream */}
      <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: '#0F4C81' }} />
            <span>System Activity Stream</span>
          </h3>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#059669', backgroundColor: '#ECFDF5', padding: '0.25rem 0.65rem', borderRadius: '99px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
            Live Sync
          </div>
        </div>

        {sortedActivities.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
            No recent system activities recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {sortedActivities.slice(0, 8).map((act) => {
              const roleColor =
                act.actorRole?.includes('Admin') ? '#0F4C81' :
                  act.actorRole?.includes('Packaging') ? '#D97706' :
                    act.actorRole?.includes('Inventory') ? '#059669' :
                      act.actorRole?.includes('Customer') ? '#7C3AED' : '#2563EB';

              return (
                <div key={act.id || `${act.action}-${act.timestamp}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '0.75rem', borderLeft: `4px solid ${roleColor}` }}>
                  <div style={{ background: '#FFFFFF', color: roleColor, padding: '0.45rem', borderRadius: '50%', flexShrink: 0, border: '1px solid #E2E8F0' }}>
                    <Clock size={16} />
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.9rem' }}>{act.action}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                        {formatActivityTime(act.timestamp)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.25rem 0 0.35rem 0', lineHeight: 1.45 }}>{act.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                      <span style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.15rem 0.5rem', borderRadius: '0.35rem', fontWeight: '700', color: roleColor }}>
                        {act.actorRole || 'System'}
                      </span>
                      <span>&bull;</span>
                      <span style={{ color: '#0F172A', fontWeight: '600' }}>{act.actorEmail}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
