import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { fetchChatSessions, fetchFirHistory, fetchAnalysisSessions } from "../services/api";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [firSessions, setFirSessions] = useState([]);
  const [analysisSessions, setAnalysisSessions] = useState([]);
  
  const [sessionNonce, setSessionNonce] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Close sidebar on mobile route changes
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const loadAllSessions = async () => {
      try {
        const chats = await fetchChatSessions().catch(() => []);
        if (chats && Array.isArray(chats)) {
          setRecentChats(chats.map(s => ({ id: s.sessionId, title: s.title, updatedAt: s.createdAt })));
        }

        const firs = await fetchFirHistory().catch(() => ({ data: [] }));
        if (firs?.success && Array.isArray(firs.data)) {
          setFirSessions(firs.data.map(s => ({ id: s.sessionId, title: `FIR Draft ${new Date(s.createdAt).toLocaleDateString()}`, updatedAt: s.createdAt })));
        }

        const analysis = await fetchAnalysisSessions().catch(() => []);
        if (analysis && Array.isArray(analysis)) {
          setAnalysisSessions(analysis.map(s => ({ id: s.sessionId, title: s.title, updatedAt: s.createdAt })));
        }
      } catch (err) {
        console.error("Failed to load layout sessions", err);
      }
    };
    loadAllSessions();
  }, [sessionNonce]);

  const refreshSessions = () => {
    setSessionNonce((prev) => prev + 1);
  };

  const registerChatActivity = (title, chatId = null) => {
    const id = chatId || `chat_${Date.now()}`;
    const entry = { id, title: title || "New chat", updatedAt: new Date().toISOString() };
    setRecentChats((prev) => [entry, ...prev.filter((item) => item.id !== id)].slice(0, 20));
    return id;
  };

  const outletContext = useMemo(
    () => ({ registerChatActivity, refreshSessions, sessionNonce }),
    [sessionNonce]
  );

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        <Sidebar 
          isOpen={isSidebarOpen} 
          close={() => setIsSidebarOpen(false)} 
          recentChats={recentChats} 
          firSessions={firSessions}
          analysisSessions={analysisSessions}
          onNewChat={refreshSessions} 
        />
      </AnimatePresence>
      
      <div className="flex-1 flex flex-col h-full relative max-w-full overflow-hidden bg-[#0d0d0f] lg:rounded-l-[2rem] border-l border-white/5 shadow-2xl">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        <Outlet context={outletContext} /> 
      </div>
      
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}