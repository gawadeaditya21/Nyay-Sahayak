import { Scale, LogOut, Settings, Menu, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext.jsx';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { language, setLanguage, languages } = useLanguage();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-white/5 bg-transparent lg:bg-[#0d0d0f]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 relative z-20">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 text-slate-300 hover:text-white lg:hidden">
          <Menu size={20} />
        </button>
        <div className="hidden sm:block p-1.5 bg-indigo-600 rounded-lg">
          <Scale size={20} className="text-white" />
        </div>
        <Link title={t("home")} to="/chat" className="hidden sm:block font-serif font-bold text-lg text-white tracking-tight hover:opacity-80 transition">
          {t('appName')}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <LanguageSwitcher />

        {user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            {user.role === 'ADMIN' && (
              <Link to="/admin" title="Admin Portal" className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-blue-400 transition-colors mr-2 border border-blue-500/30 bg-blue-500/10">
                <Shield size={18} />
              </Link>
            )}
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-white">{user.name}</span>
              <span className={`mt-0.5 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full ${user.plan === 'pro' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm' : user.plan === 'plus' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-700 text-slate-300'}`}>
                {user.plan ? `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} ${t('header.plan')}` : t('header.freePlan', 'Free Plan')}
              </span>
            </div>
            <Link to="/settings" className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-slate-400 transition-colors">
              <Settings size={18} />
            </Link>
            <button onClick={handleLogout} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition">
            {t('auth.signIn')}
          </Link>
        )}
      </div>
    </header>
  );
}
