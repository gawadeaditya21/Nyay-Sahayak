import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userStr);
    if (user.role !== 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default AdminProtectedRoute;
