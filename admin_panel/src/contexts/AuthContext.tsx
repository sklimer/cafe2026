import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

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

// Функция для безопасного логирования (можно заменить на отправку на сервер)
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[AUTH INFO] ${new Date().toISOString()}: ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[AUTH WARN] ${new Date().toISOString()}: ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.debug(`[AUTH DEBUG] ${new Date().toISOString()}: ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[AUTH DEBUG] ${new Date().toISOString()}: ${message}`, data || '');
    }
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    logger.error('useAuth вызван вне AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Восстановление пользователя из localStorage при инициализации
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        logger.info('Пользователь восстановлен из localStorage', {
          userId: parsedUser.id,
          username: parsedUser.username,
          fullUserData: parsedUser // Логируем все данные пользователя
        });

        // Проверяем наличие обязательных полей
        if (!parsedUser.username) {
          logger.warn('Восстановленный пользователь не имеет username', parsedUser);
        }

        return parsedUser;
      }
    } catch (error) {
      logger.error('Ошибка при восстановлении пользователя из localStorage', error);
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Настраиваем axios для отправки куки
  useEffect(() => {
    logger.debug('Настройка axios для отправки credentials');
    axios.defaults.withCredentials = true;
  }, []);

  // Проверяем авторизацию при загрузке (только один раз)
  useEffect(() => {
    if (!initialized) {
      logger.info('Инициализация AuthProvider, запуск проверки авторизации', {
        hasUserInState: !!user,
        userInState: user
      });
      checkAuth();
      setInitialized(true);
    }
  }, [initialized, user]);

  const checkAuth = async () => {
    const startTime = Date.now();
    logger.info('Начало проверки авторизации', {
      currentUserInState: user,
      hasLocalStorageUser: !!localStorage.getItem(LOCAL_STORAGE_KEYS.USER)
    });

    try {
      const response = await axios.get('http://localhost:8000/api/auth/check/');
      const responseTime = Date.now() - startTime;

      logger.info('Проверка авторизации завершена', {
        authenticated: response.data.authenticated,
        responseTime: `${responseTime}ms`,
        fullResponse: response.data // Логируем полный ответ
      });

      if (response.data.authenticated && response.data.user) {
        const serverUser = response.data.user;

        // ПРОВЕРКА: Логируем полные данные от сервера
        logger.info('Данные пользователя от сервера', {
          userId: serverUser.id,
          username: serverUser.username,
          email: serverUser.email,
          is_staff: serverUser.is_staff,
          allServerFields: Object.keys(serverUser) // Все поля от сервера
        });

        // Проверяем, что username есть
        if (!serverUser.username) {
          logger.error('Сервер вернул пользователя без username!', serverUser);
          // Пытаемся использовать email или id как fallback
          serverUser.username = serverUser.email || `user_${serverUser.id}`;
        }

        logger.info('Пользователь авторизован', {
          userId: serverUser.id,
          username: serverUser.username,
          isStaff: serverUser.is_staff,
          email: serverUser.email
        });

        setUser(serverUser);
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(serverUser));
        localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_AUTH_CHECK, new Date().toISOString());
      } else {
        logger.info('Пользователь не авторизован');
        setUser(null);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Ошибка при проверке авторизации', {
        error: error instanceof Error ? error.message : 'Unknown error',
        response: error instanceof Error ? error.stack : 'No stack',
        responseTime: `${responseTime}ms`
      });
      setUser(null);
    } finally {
      setLoading(false);
      logger.info('Проверка авторизации завершена, loading установлен в false', {
        userAfterCheck: user,
        loading: false
      });
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    const startTime = Date.now();
    logger.info('Попытка входа', { username });

    try {
      const response = await axios.post('http://localhost:8000/api/auth/login/', {
        username,
        password,
      });

      const responseTime = Date.now() - startTime;

      logger.info('Ответ от сервера при входе', {
        success: response.data.success,
        fullResponse: response.data,
        responseTime: `${responseTime}ms`
      });

      if (response.data.success && response.data.user) {
        const serverUser = response.data.user;

        // ПРОВЕРКА: Логируем полные данные от сервера
        logger.info('Данные пользователя от сервера при входе', {
          userId: serverUser.id,
          username: serverUser.username,
          email: serverUser.email,
          is_staff: serverUser.is_staff,
          allServerFields: Object.keys(serverUser)
        });

        // Проверяем, что username есть
        if (!serverUser.username) {
          logger.error('Сервер вернул пользователя без username при входе!', serverUser);
          // Пытаемся использовать email или id как fallback
          serverUser.username = serverUser.email || `user_${serverUser.id}`;
        }

        logger.info('Вход выполнен успешно', {
          userId: serverUser.id,
          username: serverUser.username,
          responseTime: `${responseTime}ms`
        });

        setUser(serverUser);
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(serverUser));
        localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_AUTH_CHECK, new Date().toISOString());

        // После успешного входа проверяем авторизацию еще раз
        setTimeout(() => {
          logger.info('Запуск повторной проверки авторизации после входа');
          checkAuth();
        }, 100);

        return true;
      } else {
        logger.warn('Вход не удался (неверные учетные данные или отсутствует пользователь)', {
          username,
          responseData: response.data,
          responseTime: `${responseTime}ms`
        });
        return false;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Ошибка при входе', {
        username,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: error instanceof Error ? error.stack : 'No stack',
        responseTime: `${responseTime}ms`
      });
      return false;
    }
  };

  const logout = async () => {
    const startTime = Date.now();
    const userId = user?.id;
    const username = user?.username;

    logger.info('Попытка выхода', { userId, username, currentUser: user });

    try {
      await axios.post('http://localhost:8000/api/auth/logout/');
      const responseTime = Date.now() - startTime;

      logger.info('Выход выполнен успешно', {
        userId,
        username,
        responseTime: `${responseTime}ms`
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Ошибка при выходе', {
        userId,
        username,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${responseTime}ms`
      });
    } finally {
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_AUTH_CHECK);

      logger.info('Состояние очищено, перенаправление на /login');

      // Перенаправляем на страницу входа
      window.location.href = '/login';
    }
  };

  // Логирование изменений состояния
  useEffect(() => {
    logger.debug('Состояние пользователя изменено', {
      userId: user?.id,
      username: user?.username,
      email: user?.email,
      isAuthenticated: !!user,
      fullUserObject: user
    });
  }, [user]);

  useEffect(() => {
    logger.debug('Состояние loading изменено', { loading });
  }, [loading]);

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  logger.info('AuthProvider монтируется', {
    initialized,
    hasUser: !!user,
    userData: user
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};