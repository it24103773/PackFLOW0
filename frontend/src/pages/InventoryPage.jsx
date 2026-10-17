import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import InventoryDashboard from '../components/dashboards/InventoryDashboard';

export default function InventoryPage() {
  const { token } = useAuth();

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <InventoryDashboard token={token} />
      </div>
    </DashboardLayout>
  );
}
