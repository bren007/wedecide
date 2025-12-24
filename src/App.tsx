import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import { Navbar } from './components/Navbar';

import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OrganizationSettingsPage } from './pages/OrganizationSettingsPage';
import { Dashboard } from './pages/Dashboard';
import { DecisionLayout } from './components/layouts/DecisionLayout';
import { DecisionListPage } from './pages/decisions/DecisionListPage';
import { DecisionCreatePage } from './pages/decisions/DecisionCreatePage';
import { DecisionDetailPage } from './pages/decisions/DecisionDetailPage';
import { DecisionEditPage } from './pages/decisions/DecisionEditPage';
import { MeetingLayout } from './components/layouts/MeetingLayout';
import { MeetingListPage } from './pages/meetings/MeetingListPage';
import { MeetingDetailPage } from './pages/meetings/MeetingDetailPage';
import './App.css';
import { LoadingSpinner } from './components/Loading';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="app">
      <Navbar />
      <ToastContainer />
      <ErrorBoundary>

        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/signup"
            element={<SignupPage />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />


          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute>
                <ResetPasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <OrganizationSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions"
            element={
              <ProtectedRoute>
                <DecisionLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DecisionListPage />} />
            <Route path="new" element={<DecisionCreatePage />} />
            <Route path=":id" element={<DecisionDetailPage />} />
            <Route path=":id/edit" element={<DecisionEditPage />} />
          </Route>
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <MeetingLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MeetingListPage />} />
            <Route path=":id" element={<MeetingDetailPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>

  );
}

export default App;
