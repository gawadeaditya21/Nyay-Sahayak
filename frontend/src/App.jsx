import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import AnalyzePage from './pages/AnalyzePage';
import FirPage from './pages/FirPage';
import ComplaintOutputPage from './pages/ComplaintOutputPage';
import LegalStepsPage from './pages/LegalStepsPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import AdminLayout from './components/admin/AdminLayout';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import LawManagement from './pages/admin/LawManagement';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';
import AuditLogs from './pages/admin/AuditLogs';
import SystemSettings from './pages/admin/SystemSettings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The new default home page without the sidebar/header layout */}
        <Route path="/" element={<LandingPage />} />

        {/* Routes wrapped in MainLayout will have the Sidebar and Header */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/fir" element={<FirPage />} />
          <Route path="/fir/output" element={<ComplaintOutputPage />} />
          <Route path="/steps" element={<LegalStepsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Routes outside MainLayout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />

        {/* Admin Routes wrapped in AdminLayout and RBAC */}
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="laws" element={<LawManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
