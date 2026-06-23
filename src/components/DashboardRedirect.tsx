import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * DashboardRedirect is used for the "/dashboard" fallback route.
 * It redirects global admins to the audit review page and all other users to the home page.
 */
const DashboardRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // If not authenticated, go to login (or home). Adjust as needed.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isGlobalAdmin = user?.is_global_admin || user?.isGlobalAdmin || false;
  if (isGlobalAdmin) {
    return <Navigate to="/admin/audit-review" replace />;
  }

  // Non‑admin authenticated users go to the generic home/dashboard (root)
  return <Navigate to="/" replace />;
};

export default DashboardRedirect;
