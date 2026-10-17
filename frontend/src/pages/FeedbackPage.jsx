import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import CustomerFeedbackPanel from '../components/dashboards/CustomerFeedbackPanel';
import AdminFeedbackPanel from '../components/dashboards/AdminFeedbackPanel';

export default function FeedbackPage() {
  const { user, token } = useAuth();
  const roleLower = (user?.role || 'Customer').toLowerCase();
  const isAdmin = roleLower.includes('admin') || roleLower.includes('system administrator');

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {isAdmin ? (
          <AdminFeedbackPanel token={token} />
        ) : (
          <CustomerFeedbackPanel user={user} token={token} />
        )}
      </div>
    </DashboardLayout>
  );
}
