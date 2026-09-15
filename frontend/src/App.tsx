import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/layout/Layout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TablesPage } from './pages/TablesPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { CashierPage } from './pages/CashierPage';
import { InventoryPage } from './pages/InventoryPage';
import { StaffPage } from './pages/StaffPage';
import { CustomersPage } from './pages/CustomersPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserRole } from './types';

// Protected Route Guard with Role Check
const ProtectedRoute: React.FC<{
  children: React.ReactElement;
  roles?: UserRole[];
}> = ({ children, roles }) => {
  const { user, token, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.some((r) => hasRole(r))) {
    // User doesn't have permission for this route, redirect to their role's home
    if (user.role === 'OFITSIANT') return <Navigate to="/tables" replace />;
    if (user.role === 'KASSIR') return <Navigate to="/cashier" replace />;
    if (user.role === 'OMBORCHI') return <Navigate to="/inventory" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Default Home Redirect based on Role
const HomeRedirect: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMINISTRATOR') return <Navigate to="/dashboard" replace />;
  if (user.role === 'OFITSIANT') return <Navigate to="/tables" replace />;
  if (user.role === 'KASSIR') return <Navigate to="/cashier" replace />;
  if (user.role === 'OMBORCHI') return <Navigate to="/inventory" replace />;

  return <Navigate to="/tables" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated routes within Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomeRedirect />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tables"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR', 'OFITSIANT', 'KASSIR']}>
                    <TablesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/orders"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR', 'OFITSIANT', 'KASSIR']}>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/menu"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR', 'OFITSIANT', 'KASSIR', 'OMBORCHI']}>
                    <MenuPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cashier"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR', 'KASSIR']}>
                    <CashierPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/inventory"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR', 'OMBORCHI']}>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/customers"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR', 'OFITSIANT', 'KASSIR']}>
                    <CustomersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reservations"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR', 'OFITSIANT', 'KASSIR']}>
                    <ReservationsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/staff"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR']}>
                    <StaffPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute roles={['ADMINISTRATOR']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
