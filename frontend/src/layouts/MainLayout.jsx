import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { fetchChatSessions } from "../services/api";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [chatNonce, setChatNonce] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Close sidebar on mobile route changes
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessions = await fetchChatSessions();
        if (sessions && Array.isArray(sessions)) {
          const mapped = sessions.map(s => ({
            id: s.sessionId,
            title: s.title,
            updatedAt: s.createdAt,
          }));
          setRecentChats(mapped);
        }
      } catch (err) {
        console.error("Failed to load layout sessions", err);
      }
    };
    loadSessions();
  }, [chatNonce]);

  const registerChatActivity = (title, chatId = null) => {
    const id = chatId || `chat_${Date.now()}`;
    const entry = {
      id,
      title: title || "New chat",
      updatedAt: new Date().toISOString(),
    };

    setRecentChats((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return [entry, ...filtered].slice(0, 20);
    });

    return id;
  };

  const startNewChat = () => {
    setChatNonce((prev) => prev + 1);
  };

  const outletContext = useMemo(
    () => ({ registerChatActivity, startNewChat, chatNonce }),
    [chatNonce]
  );

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        <Sidebar isOpen={isSidebarOpen} close={() => setIsSidebarOpen(false)} recentChats={recentChats} onNewChat={startNewChat} />
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