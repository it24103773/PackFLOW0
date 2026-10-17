import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchInventory,
  markAcceptedNotificationRead,
  markAllAcceptedNotificationsRead
} from '../services/api';
import {
  Package,
  LayoutDashboard,
  Box,
  Layers,
  ShoppingCart,
  Warehouse,
  Users,
  UserCheck,
  Truck,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Calendar,
  ShieldAlert,
  Bell,
  BellRing,
  CheckCheck,
  Megaphone,
  MessageSquare,
  ClipboardList
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isInventoryManager = user?.role?.toLowerCase()?.includes('inventory');

  useEffect(() => {
    if (isInventoryManager) {
      loadNotifs();
      const interval = setInterval(loadNotifs, 4000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  const loadNotifs = async () => {
    try {
      const data = await fetchInventory();
      const accepted = data.filter(i => i.supplierAcceptedAt && String(i.supplierAcceptedAt).trim() !== '');
      setNotifications(accepted);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isCustomer = !user?.role || user?.role?.toLowerCase() === 'customer';

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['all'] },
    { name: 'Announcements', path: '/announcements', icon: Megaphone, roles: ['all'] },
    { name: 'Feedback', path: '/feedback', icon: MessageSquare, roles: ['customer', 'admin'] },
    { name: 'Customer Records', path: '/customers', icon: Users, roles: ['admin'] },
    { name: 'Raw Materials & Stock', path: '/inventory', icon: Warehouse, roles: ['inventory'] },
    { name: 'Products Master', path: '/products', icon: Box, roles: ['admin'] },
    { name: 'Packaging Types', path: '/packaging-types', icon: Layers, roles: ['admin'] },
    { name: 'Production Orders', path: '/orders', icon: ShoppingCart, roles: ['admin', 'packaging'] },
    { name: 'Staff Members', path: '/staff', icon: UserCheck, roles: ['packaging', 'pm'] },
    { name: 'Material and Staff Details', path: '/material-staff-details', icon: ClipboardList, roles: ['packaging', 'pm', 'admin'] },
    { name: 'Supplier Records', path: '/suppliers', icon: Truck, roles: ['admin'] },
    { name: 'My Profile', path: '/profile', icon: User, roles: ['all'] }
  ];

  const userRoleLower = (user?.role || 'customer').toLowerCase();
  const navItems = allNavItems.filter(item => {
    if (item.roles.includes('all')) return true;
    if (isCustomer) {
      return item.roles.includes('customer') || item.roles.includes('all');
    }
    return item.roles.some(r => userRoleLower.includes(r));
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Left Sidebar Desktop */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: '260px',
        backgroundColor: '#0F172A',
        color: '#94A3B8',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        transition: '0.3s ease'
      }}>
        {/* Sidebar Brand Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            background: '#F59E0B',
            color: '#0F172A',
            padding: '0.5rem',
            borderRadius: '0.75rem',
            display: 'flex'
          }}>
            <Package size={22} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>
            Pack<span style={{ color: '#F59E0B' }}>FLOW</span>
          </span>
        </div>

        {/* Navigation Menu Links */}
        <nav style={{ flexGrow: 1, padding: '1.25rem 0.85rem', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      fontSize: '0.925rem',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      backgroundColor: isActive ? '#0F4C81' : 'transparent',
                      transition: '0.2s ease',
                      textDecoration: 'none'
                    }}
                  >
                    <Icon size={19} style={{ color: isActive ? '#F59E0B' : '#64748B' }} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        <div style={{
          padding: '1.25rem',
          borderTop: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#0F4C81',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1rem'
            }}>
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.fullName || 'User'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: '600' }}>
                {user?.role || 'Customer'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: '0.2s ease',
              width: '100%'
            }}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content View Wrapper */}
      <div style={{ flexGrow: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }} className="main-viewport">
        {/* Top Header Bar */}
        <header style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mobile-sidebar-toggle"
              style={{ display: 'none', padding: '0.5rem', color: '#0F172A' }}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.9rem', fontWeight: '600' }}>
              <Calendar size={18} style={{ color: '#0F4C81' }} />
              <span>{currentDate}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Global Supplier Order Acceptance Notification Bell for Inventory Manager */}
            {isInventoryManager && (() => {
              const unreadCount = notifications.filter(n => n.acceptedNotificationRead === false).length;
              return (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    title="Supplier Order Acceptance Notifications"
                    style={{
                      position: 'relative',
                      padding: '0.55rem',
                      borderRadius: '50%',
                      backgroundColor: unreadCount > 0 ? '#FEF3C7' : '#F1F5F9',
                      color: unreadCount > 0 ? '#D97706' : '#64748B',
                      border: unreadCount > 0 ? '1px solid #FCD34D' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: '0.2s ease'
                    }}
                  >
                    {unreadCount > 0 ? <BellRing size={20} className="animate-bounce" /> : <Bell size={20} />}
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        borderRadius: '99px',
                        padding: '0.1rem 0.4rem',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        border: '2px solid #FFFFFF'
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showNotifDropdown && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '2.75rem',
                      width: '350px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '1rem',
                      boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
                      border: '1px solid #E2E8F0',
                      zIndex: 1000,
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.65rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.925rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Truck size={17} style={{ color: '#059669' }} /> Supplier Order Acceptances
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => {
                              await markAllAcceptedNotificationsRead();
                              loadNotifs();
                            }}
                            style={{ fontSize: '0.75rem', color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800' }}
                          >
                            Mark All Read
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div style={{ fontSize: '0.825rem', color: '#94A3B8', textAlign: 'center', padding: '1.25rem 0' }}>
                          No supplier order acceptance notifications yet.
                        </div>
                      ) : (
                        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {notifications.map(item => {
                            const isUnread = item.acceptedNotificationRead === false;
                            return (
                              <div key={item.id} style={{
                                padding: '0.75rem 0.85rem',
                                borderRadius: '0.65rem',
                                backgroundColor: isUnread ? '#ECFDF5' : '#F8FAFC',
                                border: isUnread ? '1.5px solid #6EE7B7' : '1px solid #E2E8F0',
                                fontSize: '0.825rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                              }}>
                                <div style={{ fontWeight: '800', color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>{item.name}</span>
                                  <span style={{ padding: '0.15rem 0.45rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.7rem', fontWeight: '800' }}>
                                    Accepted
                                  </span>
                                </div>
                                <div style={{ color: '#64748B', fontSize: '0.775rem' }}>
                                  Supplier: <strong>{item.supplierName || 'Yuthma Global Materials'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>
                                    Qty: {item.purchasedStock || item.stockLevel} {item.unit}
                                  </span>
                                  {isUnread && (
                                    <button
                                      onClick={async () => {
                                        await markAcceptedNotificationRead(item.id);
                                        loadNotifs();
                                      }}
                                      style={{ fontSize: '0.725rem', color: '#059669', fontWeight: '800', backgroundColor: '#FFFFFF', border: '1px solid #A7F3D0', borderRadius: '0.35rem', padding: '0.15rem 0.45rem', cursor: 'pointer' }}
                                    >
                                      Acknowledge
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              padding: '0.35rem 0.85rem',
              borderRadius: '99px',
              fontSize: '0.825rem',
              fontWeight: '700'
            }}>
              <span>Role: {user?.role || 'Customer'}</span>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main style={{ flexGrow: 1, padding: '2rem' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-sidebar {
            transform: translateX(-100%);
          }
          .dashboard-sidebar.open {
            transform: translateX(0);
          }
          .main-viewport {
            margin-left: 0 !important;
          }
          .mobile-sidebar-toggle {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
