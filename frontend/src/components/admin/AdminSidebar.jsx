import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Scale, Users, LineChart, ScrollText, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: t('admin.dashboard', 'Dashboard'), path: '/admin' },
    { icon: Scale, label: t('admin.laws', 'Laws'), path: '/admin/laws' },
    { icon: Users, label: t('admin.users', 'Users'), path: '/admin/users' },
    { icon: LineChart, label: t('admin.analytics', 'Analytics'), path: '/admin/analytics' },
    { icon: ScrollText, label: t('admin.audit', 'Audit Logs'), path: '/admin/audit' },
    { icon: Settings, label: t('admin.settings', 'Settings'), path: '/admin/settings' },
  ];

  return (
    <div className="w-64 bg-[var(--color-bg-main)] text-[var(--color-text-main)] h-full flex flex-col hidden md:flex">
      <div className="p-6 border-b border-gray-800 flex items-center gap-3">
        <Scale className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold">Nyay-Sahayak Admin</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
