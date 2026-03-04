import { Plus, MessageSquare } from 'lucide-react';

export default function Sidebar({ isOpen, recentChats = [] }) {
  return (
    <div 
      className={`h-full bg-brand-surface flex flex-col text-brand-primary transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
        isOpen ? 'w-64 p-4 border-r border-brand-accent/30 opacity-100' : 'w-0 p-0 border-none opacity-0'
      }`}
    >
      <div className="w-56 flex flex-col h-full">
        <button className="flex items-center justify-between w-full bg-brand-base p-3 rounded-lg shadow-sm hover:shadow-md transition mb-6 font-medium text-brand-primary">
          <span>New Chat</span>
          <Plus size={20} />
        </button>

        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70">Recent</p>
          <div className="flex flex-col gap-2">
            {recentChats.length === 0 ? (
              <p className="text-sm opacity-60 px-2 italic">No recent chats yet.</p>
            ) : (
              recentChats.map((chat, index) => (
                <button key={index} className="flex items-center gap-3 p-2 rounded-md hover:bg-brand-base transition text-left text-sm truncate">
                  <MessageSquare size={16} className="shrink-0 opacity-70" />
                  <span className="truncate">{chat.title}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}