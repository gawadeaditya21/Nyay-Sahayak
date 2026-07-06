import { useNavigate } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';

export default function AdminHeader() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center">
        <button className="md:hidden mr-4 text-gray-500 hover:text-gray-700">
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-medium text-gray-800 hidden md:block">Admin Portal</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-gray-600 border-l pl-6 border-gray-200">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <User size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">{user?.name || 'Admin'}</span>
            <span className="text-xs text-gray-500">{user?.role || 'ADMIN'}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
