import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import AnnouncementsSidebar from '../components/dashboards/AnnouncementsSidebar';

export default function AnnouncementsPage() {
  const { user, token } = useAuth();

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <AnnouncementsSidebar user={user} token={token} userRole={user?.role || 'Customer'} compact={false} />
      </div>
    </DashboardLayout>
  );
}
