import React, { useState, useEffect } from 'react';
import { fetchOrderHistory, fetchMyOrderHistory } from '../../services/api';
import { History, Search, Package, Calendar, User, DollarSign, Activity, CheckCircle2, Clock, Filter } from 'lucide-react';

export default function OrderHistoryTable({ token, isCustomer = false }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      const data = isCustomer ? await fetchMyOrderHistory(token) : await fetchOrderHistory();
      setHistoryList(data || []);
    } catch (e) {
      console.error('Error loading order history:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = historyList.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (item.orderNumber || '').toLowerCase().includes(query) ||
      (item.customerName || '').toLowerCase().includes(query) ||
      (item.customerEmail || '').toLowerCase().includes(query) ||
      (item.packagingType || '').toLowerCase().includes(query) ||
      (item.eventDescription || '').toLowerCase().includes(query);

    if (statusFilter !== 'all') {
      const st = (item.status || '').toLowerCase();
      if (statusFilter === 'completed' && !st.includes('completed')) return false;
      if (statusFilter === 'production' && !st.includes('production') && !st.includes('progress')) return false;
      if (statusFilter === 'pending' && !st.includes('pending') && !st.includes('placement')) return false;
    }

    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    const st = (status || '').toLowerCase();
    if (st.includes('completed') || st.includes('closed')) {
      return { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', label: status || 'Completed' };
    }
    if (st.includes('production') || st.includes('progress') || st.includes('pm approved')) {
      return { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD', label: status || 'In Production' };
    }
    if (st.includes('rejected') || st.includes('denied')) {
      return { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5', label: status || 'Rejected' };
    }
    return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', label: status || 'Pending' };
  };

  return (
    <div className="card-rounded" style={{
      padding: '1.5rem',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={22} style={{ color: '#0F4C81' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              Comprehensive Order History Table
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
            Historical record of all packaging production orders, customer submissions, status progression & events.
          </p>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer..."
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                borderRadius: '0.65rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '0.65rem',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              backgroundColor: '#FFFFFF',
              fontWeight: '600',
              color: '#334155'
            }}
          >
            <option value="all">All Order Statuses</option>
            <option value="pending">Pending / Placement</option>
            <option value="production">In Production</option>
            <option value="completed">Completed / Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748B', fontSize: '0.9rem' }}>
          Loading order history table...
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          backgroundColor: '#F8FAFC',
          borderRadius: '0.85rem',
          border: '1px dashed #CBD5E1',
          color: '#64748B',
          fontSize: '0.875rem'
        }}>
          No order history records found.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '800' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Order #</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.85rem 1rem' }}>Packaging Specification</th>
                <th style={{ padding: '0.85rem 1rem' }}>Quantity</th>
                <th style={{ padding: '0.85rem 1rem' }}>Total Price</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status & Progress</th>
                <th style={{ padding: '0.85rem 1rem' }}>Event Record Log</th>
                <th style={{ padding: '0.85rem 1rem' }}>Date & Logged By</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item, idx) => {
                const sBadge = getStatusBadge(item.status);
                return (
                  <tr key={item.id || idx} style={{
                    borderBottom: idx === filteredList.length - 1 ? 'none' : '1px solid #F1F5F9',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                  }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0F4C81', whiteSpace: 'nowrap' }}>
                      {item.orderNumber || `ORD-2026-${item.orderId || item.id}`}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.customerName || 'Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.customerEmail || 'customer@packflow.com'}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#334155' }}>
                      {item.packagingType || 'Corrugated Packaging'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>
                      {(item.quantity || 0).toLocaleString()} pcs
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#059669' }}>
                      LKR {(item.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: '800',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '99px',
                          backgroundColor: sBadge.bg,
                          color: sBadge.text,
                          border: `1px solid ${sBadge.border}`,
                          display: 'inline-block',
                          width: 'fit-content'
                        }}>
                          {sBadge.label}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ flexGrow: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(100, Math.max(0, item.progressPercentage || 0))}%`,
                              height: '100%',
                              backgroundColor: item.progressPercentage >= 100 ? '#10B981' : '#3B82F6'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.725rem', fontWeight: '800', color: '#475569' }}>
                            {item.progressPercentage || 0}%
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.8rem', maxWidth: '240px' }}>
                      {item.eventDescription || 'Order activity recorded.'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.775rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '600' }}>{item.createdAt ? item.createdAt.replace('T', ' ').substring(0, 16) : ''}</div>
                      <div style={{ fontSize: '0.725rem', color: '#94A3B8' }}>By: {item.updatedBy || 'System'}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
