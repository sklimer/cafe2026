
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import api from '../services/api'; // Импортируем готовый api инстанс

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Константы для ключей localStorage
const LOCAL_STORAGE_KEYS = {
  USER: 'admin_user',
  LAST_AUTH_CHECK: 'last_auth_check'
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Ошибка при восстановлении пользователя из localStorage:', error);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const isCheckingAuth = useRef(false);

  // Проверяем авторизацию при загрузке (только один раз)
  useEffect(() => {
    if (!initialized && !isCheckingAuth.current) {
      console.log('Инициализация AuthProvider, запуск проверки авторизации');
      isCheckingAuth.current = true;
      checkAuth().finally(() => {
        setInitialized(true);
        isCheckingAuth.current = false;
      });
    }
  }, [initialized]);

  const checkAuth = useCallback(async () => {
    console.log('Начало проверки авторизации');

    try {
      const response = await api.get('/auth/check/');

      if (response.data.authenticated && response.data.user && response.data.user.is_staff) {
        const serverUser = response.data.user;

        if (!serverUser.username) {
          serverUser.username = serverUser.email || `user_${serverUser.id}`;
        }

        console.log('Администратор авторизован:', serverUser.username);
        setUser(serverUser);
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(serverUser));
        localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_AUTH_CHECK, new Date().toISOString());
      } else {
        console.log('Пользователь не является администратором или не авторизован');
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      }
    } catch (error: any) {
      console.log('Ошибка при проверке авторизации:', error.message);
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    } finally {
      setLoading(false);
      console.log('Проверка авторизации завершена');
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    console.log('Попытка входа:', username);

    try {
      const response = await api.post('/auth/login/', {
        username,
        password,
      });
      console.log('Вход response.data.user.is_staff:', response.data.user.is_staff)
      console.log('Вход response.data.user:', response.data.user)
      console.log('Вход response.data.success:', response.data.success)
      if (response.data.success && response.data.user && response.data.user.is_staff) {
        const serverUser = response.data.user;

        if (!serverUser.username) {
          serverUser.username = serverUser.email || `user_${serverUser.id}`;
        }

        console.log('Вход администратора выполнен успешно:', serverUser.username);
        setUser(serverUser);
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(serverUser));
        localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_AUTH_CHECK, new Date().toISOString());
        return true;
      } else {
        if (!response.data.user?.is_staff) {
          console.log('Вход не удался: пользователь не является администратором');
        }
        console.log('Вход не удался (сервер вернул false)');
        return false;
      }
    } catch (error: any) {
      console.error('Ошибка при входе:', error.response?.data || error.message);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    const userId = user?.id;
    const username = user?.username;

    console.log('Попытка выхода:', username);

    try {
      await api.post('/auth/logout/');
      console.log('Выход выполнен успешно');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_AUTH_CHECK);
      window.location.href = '/login';
    }
  }, [user]);

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};