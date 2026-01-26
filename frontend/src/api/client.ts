import { ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Типы для логов
interface ApiLog {
  timestamp: string;
  endpoint: string;
  method: string;
  request?: any;
  response?: any;
  status?: number;
  duration: number;
  success: boolean;
  error?: string;
}

class ApiClient {
  private logs: ApiLog[] = [];
  private isLoggingEnabled = process.env.NODE_ENV === 'development';

  // Метод для получения логов (может быть использован для отладки)
  getLogs(): ApiLog[] {
    return this.logs;
  }

  // Метод для очистки логов
  clearLogs(): void {
    this.logs = [];
  }

  // Включение/выключение логирования
  setLoggingEnabled(enabled: boolean): void {
    this.isLoggingEnabled = enabled;
  }

  private addLog(log: ApiLog): void {
    if (!this.isLoggingEnabled) return;

    this.logs.push(log);

    // Ограничиваем размер логов (храним последние 100 записей)
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Выводим в консоль только в development режиме
    if (process.env.NODE_ENV === 'development') {
      this.printLog(log);
    }
  }

  private printLog(log: ApiLog): void {
    const method = log.method.padEnd(7);
    const status = log.status ? `[${log.status}]` : '[---]';
    const duration = `${log.duration}ms`;
    const success = log.success ? '✓' : '✗';

    console.groupCollapsed(`API ${success} ${method} ${log.endpoint} ${status} ${duration}`);

    if (!log.success && log.error) {
      console.error('Ошибка:', log.error);
    }

    console.groupEnd();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const log: Partial<ApiLog> = {
      timestamp: new Date().toISOString(),
      endpoint,
      method: options.method || 'GET',
    };

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const config: RequestInit = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      };

      // Добавляем тело запроса в лог (если есть)
      if (options.body) {
        try {
          log.request = JSON.parse(options.body as string);
        } catch {
          log.request = options.body;
        }
      }

      // Получение initData из Telegram Web App
      let telegramInitData = '';

      if (typeof Telegram !== 'undefined' && Telegram.WebApp?.initData) {
        telegramInitData = Telegram.WebApp.initData;
      } else if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
        telegramInitData = window.Telegram.WebApp.initData;
      }

      // Передаем initData только если он не пустой
      if (telegramInitData && telegramInitData.trim() !== '') {
        config.headers = {
          ...config.headers,
          'X-Telegram-Init-Data': telegramInitData,
        };
      }

      const response = await fetch(url, config);
      const duration = Date.now() - startTime;

      log.status = response.status;
      log.duration = duration;

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } else {
            errorMessage = await response.text() || errorMessage;
          }
        } catch (e) {
          console.error('Ошибка парсинга ответа об ошибке:', e);
        }

        log.success = false;
        log.error = errorMessage;
        this.addLog(log as ApiLog);

        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
        } as ApiResponse<T>;
      }

      let data;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          throw new Error('Ответ не в формате JSON');
        }
      } catch (error) {
        log.success = false;
        log.error = 'Failed to parse JSON response';
        this.addLog(log as ApiLog);

        return {
          success: false,
          error: 'Failed to parse response',
          statusCode: response.status,
        } as ApiResponse<T>;
      }

      // Если ответ уже имеет поле success, возвращаем как есть
      if (data && typeof data === 'object' && 'success' in data) {
        log.success = data.success;
        log.response = data;
        this.addLog(log as ApiLog);
        return data as ApiResponse<T>;
      }

      // Иначе оборачиваем в стандартную структуру
      log.success = true;
      log.response = data;
      this.addLog(log as ApiLog);

      return {
        success: true,
        data: data,
      } as ApiResponse<T>;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.success = false;
      log.error = error instanceof Error ? error.message : 'Unknown error occurred';
      log.duration = duration;

      this.addLog(log as ApiLog);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      } as ApiResponse<T>;
    }
  }

  // Метод для экспорта логов в файл (для отладки)
  exportLogs(): void {
    const logData = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Authentication
  async login(telegramData: any) {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(telegramData),
    });
  }

  // Restaurants
  async getRestaurants() {
    return this.request('/restaurants/');
  }

  async getRestaurant(id: string) {
    return this.request(`/restaurants/${id}/`);
  }

  // Categories
  async getCategories(restaurantId: string) {
    return this.request<{
      restaurant: any;
      categories: any[];
      products: any[];
    }>(`/restaurants/${restaurantId}/menu/`);
  }

  // Products
  async getProducts(restaurantId: string, categoryId?: string) {
    if (categoryId) {
      return this.request(`/categories/${categoryId}/products/`);
    }
    return this.request(`/restaurants/${restaurantId}/menu/`);
  }

  async getProduct(productId: string) {
    return this.request(`/products/${productId}/`);
  }

  // User
  async getUser() {
    return this.request('/profile/');
  }

  async updateUser(userData: Partial<any>) {
    return this.request('/profile/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Addresses
  async getAddresses() {
    return this.request('/addresses/');
  }

  async createAddress(addressData: any) {
    return this.request('/addresses/', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }

  async updateAddress(addressId: string, addressData: any) {
    return this.request(`/addresses/${addressId}/`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(addressId: string) {
    return this.request(`/addresses/${addressId}/`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders() {
    return this.request('/profile/orders/');
  }

  async getOrder(orderId: string) {
    return this.request(`/orders/${orderId}/`);
  }

  async createOrder(orderData: any) {
    return this.request('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Cart
  async getCart() {
    return this.request('/cart/');
  }

  async addToCart(itemData: any) {
    return this.request('/cart/add/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateCartItem(itemId: string, quantity: number) {
    return this.request(`/cart/update/${itemId}/`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: string) {
    return this.request(`/cart/remove/${itemId}/`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart/clear/', {
      method: 'DELETE',
    });
  }

  // Promotions
  async getPromotions() {
    return this.request('/promo/active/');
  }

  // Branches
  async getBranches(restaurantId: string) {
    return this.request(`/restaurants/${restaurantId}/branches/`);
  }
}

export const apiClient = new ApiClient();

// Для удобства отладки, добавляем глобальный доступ к логам в development режиме
if (process.env.NODE_ENV === 'development') {
  (window as any).apiLogs = apiClient.getLogs.bind(apiClient);
}
}