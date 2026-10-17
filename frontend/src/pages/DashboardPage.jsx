import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import PackagingManagerDashboard from '../components/dashboards/PackagingManagerDashboard';
import InventoryDashboard from '../components/dashboards/InventoryDashboard';
import CustomerDashboard from '../components/dashboards/CustomerDashboard';
import SupplierDashboard from '../components/dashboards/SupplierDashboard';

export default function DashboardPage() {
  const { user, token } = useAuth();

  const role = user?.role || 'Customer';
  const lowerRole = role.toLowerCase();

  const isAdmin = lowerRole.includes('admin') || lowerRole.includes('system administrator');
  const isPackagingManager = lowerRole.includes('packaging');
  const isInventoryManager = lowerRole.includes('inventory');
  const isSupplier = lowerRole.includes('supplier');

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {isAdmin && <AdminDashboard token={token} />}
        {isPackagingManager && <PackagingManagerDashboard token={token} />}
        {isInventoryManager && <InventoryDashboard token={token} isDashboardView={true} />}
        {isSupplier && <SupplierDashboard user={user} token={token} />}
        {!isAdmin && !isPackagingManager && !isInventoryManager && !isSupplier && (
          <CustomerDashboard user={user} token={token} />
        )}
      </div>
    </DashboardLayout>
  );
}
