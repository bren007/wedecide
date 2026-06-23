import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardRedirect from './components/DashboardRedirect';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import { Navbar } from './components/Navbar';
import { ScrollToTop } from './components/ScrollToTop';

import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OrganizationSettingsPage } from './pages/OrganizationSettingsPage';
import { AuditFunnelPage } from './pages/AuditFunnelPage';
import { SecureDropPage } from './pages/SecureDropPage';
import { AuditReviewPage } from './pages/AuditReviewPage';
import { PulseDashboardPage } from './pages/PulseDashboardPage';
import { AuditSuccessPage } from './pages/AuditSuccessPage';

import { CommandCenterPage } from './pages/CommandCenterPage';
import { InitiativeProposalPage } from './pages/InitiativeProposalPage';
import { StrategicIngestionPage } from './pages/StrategicIngestionPage';
import { StrategicLedgerPage } from './pages/StrategicLedgerPage';
import { PublicLayout } from './components/layouts/PublicLayout';
import { PricingPage } from './pages/PricingPage';
import { MissionPage } from './pages/MissionPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { NDAPage } from './pages/NDAPage';
import './App.css';
import { LoadingSpinner } from './components/Loading';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      <Navbar />
      <ToastContainer />
      <div className={`flex-1 flex flex-col min-w-0 ${isAuthenticated && location.pathname !== '/' ? 'pt-16 lg:pt-0 lg:ml-64' : ''}`}>
        <ErrorBoundary>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route
                path="/"
                element={isAuthenticated ? <Navigate to="/command-center" replace /> : <LandingPage />}
              />
              <Route
                path="/audit"
                element={<AuditFunnelPage />}
              />
              <Route
                path="/audit-success"
                element={<AuditSuccessPage />}
              />
              <Route
                path="/secure-drop"
                element={<SecureDropPage />}
              />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/mission" element={<MissionPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/nda" element={<NDAPage />} />
            </Route>

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
              path="/command-center"
              element={
                <ProtectedRoute>
                  <CommandCenterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-review"
              element={
                <ProtectedRoute adminOnly>
                  <AuditReviewPage />
                </ProtectedRoute>
              }
            />
            {/* Dashboard fallback */}
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route
              path="/admin/pulse"
              element={
                <ProtectedRoute>
                  <PulseDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/propose-initiative"
              element={
                <ProtectedRoute>
                  <InitiativeProposalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strategic-ingestion"
              element={
                <ProtectedRoute>
                  <StrategicIngestionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strategic-ledger"
              element={
                <ProtectedRoute>
                  <StrategicLedgerPage />
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
          </Routes>
        </ErrorBoundary>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>

  );
}

export default App;
