import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/MainLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { ContractsPage } from './pages/ContractsPage';
import { ProjectsGrantsPage } from './pages/ProjectsGrantsPage';
import { VendorsPage } from './pages/VendorsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; permission?: string }> = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Secure Back-office modules */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assets/*" 
            element={
              <ProtectedRoute permission="assets:read">
                <AssetsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/maintenance/*" 
            element={
              <ProtectedRoute permission="maintenance:read">
                <MaintenancePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/contracts/*" 
            element={
              <ProtectedRoute permission="contracts:read">
                <ContractsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/*" 
            element={
              <ProtectedRoute permission="projects:read">
                <ProjectsGrantsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vendors/*" 
            element={
              <ProtectedRoute permission="vendors:read">
                <VendorsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute permission="reports:read">
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/audit-logs" 
            element={
              <ProtectedRoute permission="audit:read">
                <AuditLogsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/administration" 
            element={
              <ProtectedRoute permission="settings:write">
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
