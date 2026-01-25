import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  console.log('[PROTECTED ROUTE] Проверка доступа:', {
    user,
    loading,
    hasUser: !!user,
    userUsername: user?.username
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('[PROTECTED ROUTE] Пользователь не авторизован, редирект на /login');
    return <Navigate to="/login" replace />;
  }

  console.log('[PROTECTED ROUTE] Доступ разрешен для пользователя:', user.username);
  return children;
};

export default ProtectedRoute; // ← Добавьте эту строку