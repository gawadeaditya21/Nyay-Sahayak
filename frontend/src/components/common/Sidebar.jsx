import { useState } from "react";
import { MessageSquarePlus, FileText, Search, LayoutList, Gauge } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useTranslation } from "react-i18next";

function groupSessionsByWindow(sessions = []) {
  const now = new Date();
  const today = [];
  const previous = [];

  sessions.forEach((session) => {
    const updated = new Date(session.updatedAt);
    const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
    if (diffDays < 1) {
      today.push(session);
    } else if (diffDays <= 7) {
      previous.push(session);
    }
  });

  return { today, previous };
}

export default function Sidebar({ isOpen, close, recentChats = [], firSessions = [], analysisSessions = [], onNewChat }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("chat");
  const location = useLocation();
  const isLoggedIn = Boolean(localStorage.getItem("token") && localStorage.getItem("user"));

  const getActiveSessions = () => {
    switch (activeTab) {
      case "fir": return firSessions;
      case "analysis": return analysisSessions;
      case "chat":
      default: return recentChats;
    }
  };

  const getBaseRoute = () => {
    switch (activeTab) {
      case "fir": return "/fir";
      case "analysis": return "/analyze";
      case "chat":
      default: return "/chat";
    }
  };

  const { today, previous } = groupSessionsByWindow(getActiveSessions());

  return (
    <Motion.aside
      className={`fixed inset-y-0 left-0 z-40 flex h-full w-80 flex-col bg-[#050505] px-5 py-6 transition-transform lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <span className="font-serif text-lg font-bold text-white tracking-tight">Nyay Sahayak</span>
      </div>

      <div className="space-y-3">
        {isLoggedIn && (
          <Link
            to="/dashboard"
            onClick={close}
            className={`group flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
              location.pathname === "/dashboard"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                : "border-emerald-500/20 bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600 hover:text-white"
            }`}
          >
            <Gauge size={18} className="transition-transform group-hover:scale-110" />
            {t("sidebar.dashboard")}
          </Link>
        )}
        <Link
          to="/chat"
          onClick={() => { onNewChat(); close(); }}
          className="group flex items-center justify-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-600/10 px-4 py-3 text-sm font-bold text-indigo-300 transition-all hover:bg-indigo-600 hover:text-white"
        >
          <MessageSquarePlus size={18} className="transition-transform group-hover:scale-110" />
          {t("sidebar.newChat")}
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/fir"
            onClick={() => { onNewChat(); close(); }}
            className="group flex items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100"
          >
            <FileText size={14} className="transition-transform group-hover:scale-110" />
            {t("sidebar.generateFir")}
          </Link>
          <Link
            to="/analyze"
            onClick={() => { onNewChat(); close(); }}
            className="group flex items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100"
          >
            <Search size={14} className="transition-transform group-hover:scale-110" />
            {t("sidebar.analyzeDoc")}
          </Link>
        </div>
      </div>

      <div className="mt-8 flex rounded-xl bg-white/5 p-1">
        {[
          { id: "chat", label: t("sidebar.tabs.chats") },
          { id: "fir", label: t("sidebar.tabs.firs") },
          { id: "analysis", label: t("sidebar.tabs.docs") }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              activeTab === tab.id ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex-1 space-y-8 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          <Motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{t("sidebar.today")}</p>
              <div className="mt-3 space-y-2">
                {today.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-500">
                    {t("sidebar.noHistoryToday", { type: t(`sidebar.historyTypes.${activeTab}`) })}
                  </div>
                ) : (
                  today.map((session) => (
                    <Link
                      key={session.id}
                      to={`${getBaseRoute()}?session=${session.id}`}
                      onClick={close}
                      className={`block rounded-xl border px-3 py-3 text-xs transition-all ${
                        location.search.includes(`session=${session.id}`) 
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-200" 
                          : "border-white/5 bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LayoutList size={14} className="shrink-0 opacity-70" />
                        <div className="truncate font-semibold">{session.title}</div>
                      </div>
                      <div className="mt-2 pl-6 text-[10px] text-slate-500">
                        {new Date(session.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{t("sidebar.previousSevenDays")}</p>
              <div className="mt-3 space-y-2">
                {previous.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-500">
                    {t("sidebar.noRecentHistory")}
                  </div>
                ) : (
                  previous.map((session) => (
                    <Link
                      key={session.id}
                      to={`${getBaseRoute()}?session=${session.id}`}
                      onClick={close}
                      className={`block rounded-xl border px-3 py-3 text-xs transition-all ${
                        location.search.includes(`session=${session.id}`) 
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-200" 
                          : "border-white/5 bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LayoutList size={14} className="shrink-0 opacity-70" />
                        <div className="truncate font-semibold">{session.title}</div>
                      </div>
                      <div className="mt-2 pl-6 text-[10px] text-slate-500">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </Motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 rounded-2xl border border-indigo-500/10 bg-indigo-600/5 p-4">
        <p className="text-[11px] font-semibold text-indigo-300">Nyay Sahayak</p>
        <p className="mt-2 text-[11px] text-slate-500">{t("sidebar.tagline")}</p>
      </div>
    </Motion.aside>
  );
}
