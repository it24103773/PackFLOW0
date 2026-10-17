import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import PackagingTypesPage from './pages/PackagingTypesPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import PlaceholderPage from './pages/PlaceholderPage';
import SupplierRegisterPage from './pages/SupplierRegisterPage';
import StaffPage from './pages/StaffPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import FeedbackPage from './pages/FeedbackPage';
import MaterialStaffDetailsPage from './pages/MaterialStaffDetailsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/supplier-register" element={<SupplierRegisterPage />} />

        {/* Protected Dashboard & Module Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/packaging-types" element={<ProtectedRoute><PackagingTypesPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><StaffPage /></ProtectedRoute>} />
        <Route path="/material-staff-details" element={<ProtectedRoute><MaterialStaffDetailsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><PlaceholderPage title="Reports & Analytics Module" description="Packaging production overview, cost estimations, and turnaround analytics." /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PlaceholderPage title="System Configuration Module" description="Application preferences, security policies, and role permissions." /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
