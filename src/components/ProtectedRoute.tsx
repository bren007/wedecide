import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

/**
 * ProtectedRoute ensures the user is authenticated.
 * If adminOnly is true, also checks that the user has global admin rights.
 * Non‑authenticated users are redirected to /login.
 * Authenticated non‑admin users are redirected to / (home) when adminOnly is required.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isLoading, user, isGlobalAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#666',
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !(isGlobalAdmin || user?.roles?.includes('global_admin'))) {
    // Not a global admin – redirect to home or a fallback dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
