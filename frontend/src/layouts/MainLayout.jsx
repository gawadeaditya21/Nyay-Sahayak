import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [recentChats, setRecentChats] = useState([]);

  return (
    <div className="flex h-screen w-full bg-brand-base overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} recentChats={recentChats} />
      
      <div className="flex-1 flex flex-col h-full relative">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        <Outlet /> 
      </div>
    </div>
  );
}