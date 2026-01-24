import { create } from 'zustand';
import { User, TelegramUser } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;

  // Actions
  login: (telegramData: TelegramUser) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;

  // Getters
  hasPhone: boolean;
  isNewUser: boolean;
  bonusBalance: number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  login: async (telegramData: TelegramUser) => {
    set({ loading: true });
    
    try {
      // Здесь будет вызов API для аутентификации
      // Пока что используем заглушку
      const mockUser: User = {
        id: `user_${telegramData.id}`,
        telegramId: telegramData.id.toString(),
        firstName: telegramData.first_name,
        lastName: telegramData.last_name,
        username: telegramData.username,
        phone: '+7 (999) 123-45-67', // В реальной реализации будет получаться из профиля
        email: undefined,
        avatar: telegramData.photo_url,
        bonusBalance: 150,
        referralCode: `ref_${telegramData.username || telegramData.first_name}`,
        notificationSettings: {
          notifications: true,
          promotions: true,
          news: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      set({ 
        user: mockUser, 
        isAuthenticated: true, 
        loading: false 
      });
    } catch (error) {
      console.error('Login failed:', error);
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    set({ 
      user: null, 
      isAuthenticated: false, 
      loading: false 
    });
  },

  updateProfile: (data: Partial<User>) => set((state) => ({
    ...state,
    user: state.user ? { ...state.user, ...data } : null
  })),

  // Computed properties
  get hasPhone() {
    return !!get().user?.phone;
  },
  
  get isNewUser() {
    if (!get().user) return false;
    const createdAt = new Date(get().user!.createdAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7; // Считаем новым пользователем в течение недели
  },
  
  get bonusBalance() {
    return get().user?.bonusBalance || 0;
  }
}));