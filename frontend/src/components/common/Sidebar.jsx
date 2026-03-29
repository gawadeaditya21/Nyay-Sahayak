import { MessageSquarePlus, History, ShieldCheck, FileSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#09090b] border-r border-white/5 flex flex-col p-4 hidden lg:flex">
      <Link
        to="/chat"
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-indigo-400 font-bold text-sm hover:bg-white/10 transition mb-8"
      >
        <MessageSquarePlus size={18} /> New Chat
      </Link>

      <nav className="flex-1 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold px-4 mb-4">Main Menu</p>
        <Link to="/chat" className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 rounded-xl transition text-sm font-medium">
          <History size={18} /> Legal Chat
        </Link>
        <Link to="/analyze" className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 rounded-xl transition text-sm font-medium">
          <FileSearch size={18} /> Analyze Document
        </Link>
        <Link to="/steps" className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 rounded-xl transition text-sm font-medium">
          <ShieldCheck size={18} /> See Steps
        </Link>
      </nav>

      <div className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl mt-auto">
        <p className="text-[11px] font-bold text-indigo-400 mb-1 italic underline">AI Gavel v1.0</p>
        <p className="text-[10px] text-slate-500 leading-relaxed">Secure forensic environment for legal documents.</p>
      </div>
    </aside>
  );
}
