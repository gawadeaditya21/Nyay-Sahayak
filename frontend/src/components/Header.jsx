import { Menu, X, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header({ toggleSidebar, isSidebarOpen }) {
  return (
    <header className="flex justify-between items-center p-4 bg-brand-base text-brand-primary">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-brand-surface rounded-md transition duration-300 transform hover:scale-105"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <Link to="/chat" className="text-2xl font-serif font-bold tracking-wide hover:opacity-80 transition">
          Nyay Sahayak
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/login" className="bg-brand-primary text-brand-base px-4 py-2 rounded-md font-medium hover:bg-brand-accent transition shadow-sm hover:shadow">
          Login / Register
        </Link>
        <Link to="/settings" className="flex items-center gap-2 p-2 hover:bg-brand-surface rounded-md transition font-medium">
          <Settings size={20} />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </div>
    </header>
  );
}