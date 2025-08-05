import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Import pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AddApplicationPage from './pages/applications/AddApplicationPage';
import ApplicationsPage from './pages/applications/ApplicationsPage';
import EditApplicationPage from './pages/applications/EditApplicationPage';
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage';
import { InterviewsPage } from './pages/interviews/InterviewsPage';
import CompaniesPage from './pages/companies/CompaniesPage';
import AddCompanyPage from './pages/companies/AddCompanyPage';
import EditCompanyPage from './pages/companies/EditCompanyPage';
import DocumentsPage from './pages/documents/DocumentsPage'

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes (no layout) */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} 
      />
      
      {/* Protected routes (with AppLayout) */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/applications/add" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <AddApplicationPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/applications" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <ApplicationsPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* FIXED: Added ProtectedRoute + AppLayout wrappers */}
      <Route 
        path="/applications/edit/:id" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <EditApplicationPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/applications/:id" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <ApplicationDetailPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/interviews" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <InterviewsPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />


      <Route 
          path="/companies/add" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <AddCompanyPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/companies/edit/:id" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <EditCompanyPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/companies" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <CompaniesPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/documents" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <DocumentsPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
      
      {/* Default redirect */}
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
      />
    </Routes>
  );
}

export default App;