import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
// Import the new LandingPage
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The new default home page without the sidebar/header layout */}
        <Route path="/" element={<LandingPage />} />

        {/* Routes wrapped in MainLayout will have the Sidebar and Header */}
        <Route element={<MainLayout />}>
          {/* ChatPage is now at /chat */}
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Routes outside MainLayout */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}