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
  private isLoggingEnabled = true;

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

    // Выводим в консоль для отладки
    this.printLog(log);
  }

  private printLog(log: ApiLog): void {
    const timestamp = log.timestamp;
    const endpoint = log.endpoint;
    const method = log.method.padEnd(7);
    const status = log.status ? `[${log.status}]` : '[---]';
    const duration = `${log.duration}ms`.padStart(6);
    const success = log.success ? '✓' : '✗';

    console.groupCollapsed(`API ${success} ${method} ${endpoint} ${status} ${duration}`);
    console.log(`Время: ${timestamp}`);
    console.log(`Длительность: ${log.duration}ms`);

    if (log.request) {
      console.log('Запрос:', log.request);
    }

    if (log.success && log.response) {
      console.log('Ответ:', log.response);
    }

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

      console.log(`🌐 Полный URL запроса: ${url}`);

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

      // Добавляем Telegram аутентификацию
      const telegramUser = window.Telegram?.WebApp?.initData;
      if (telegramUser) {
        config.headers = {
          ...config.headers,
          'X-Telegram-Init-Data': telegramUser,
        };
        log.request = {
          ...log.request,
          telegramInitData: '[PRESENT]',
        };
      }

      console.log(`🚀 API Запрос: ${config.method || 'GET'} ${url}`);
      console.log('📋 Заголовки запроса:', config.headers);

      const response = await fetch(url, config);
      const duration = Date.now() - startTime;

      log.status = response.status;
      log.duration = duration;

      console.log(`📥 Ответ от сервера: ${response.status} ${response.statusText}`);

      // Проверяем content-type
      const contentType = response.headers.get('content-type');
      console.log('📋 Content-Type:', contentType);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;

        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            console.log('❌ JSON ошибка:', errorData);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } else {
            errorData = await response.text();
            console.log('❌ Текст ошибки:', errorData);
            errorMessage = errorData || errorMessage;
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга ответа об ошибке:', e);
        }

        log.success = false;
        log.error = errorMessage;
        log.response = errorData;

        this.addLog(log as ApiLog);
        console.error(`❌ API Ошибка: ${endpoint}`, {
          status: response.status,
          error: errorMessage,
          duration,
        });

        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
        } as ApiResponse<T>;
      }

      let data;
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          console.log('📊 Данные ответа:', data);
        } else {
          const text = await response.text();
          console.log('📊 Текстовый ответ:', text);
          throw new Error('Ответ не в формате JSON');
        }
      } catch (error) {
        log.success = false;
        log.error = 'Failed to parse JSON response';
        log.response = null;

        this.addLog(log as ApiLog);
        console.error(`❌ JSON Parse Error: ${endpoint}`, error);

        return {
          success: false,
          error: 'Failed to parse response',
          statusCode: response.status,
        } as ApiResponse<T>;
      }

      // Проверяем структуру ответа
      log.success = true;
      log.response = data;

      // Если ответ уже имеет поле success, возвращаем как есть
      if (data && typeof data === 'object' && 'success' in data) {
        console.log('📦 Ответ уже имеет поле success, возвращаем как есть');
        this.addLog(log as ApiLog);
        return data as ApiResponse<T>;
      }

      // Иначе оборачиваем в стандартную структуру
      this.addLog(log as ApiLog);
      console.log(`✅ API Успех: ${endpoint}`, {
        status: response.status,
        duration,
        data: data,
      });

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
      console.error(`💥 API Сбой: ${endpoint}`, {
        error,
        duration,
      });

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
    console.log('🔐 Логин с Telegram данными');
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(telegramData),
    });
  }

  // Restaurants
  async getRestaurants() {
    console.log('🍽️ Получение списка ресторанов');
    return this.request('/restaurants/');
  }

  async getRestaurant(id: string) {
    console.log(`🏪 Получение ресторана ID: ${id}`);
    return this.request(`/restaurants/${id}/`);
  }

  // Categories
  async getCategories(restaurantId: string) {
    console.log(`📂 Получение категорий для ресторана ID: ${restaurantId}`);
    return this.request<{
      restaurant: any;
      categories: any[];
      products: any[];
    }>(`/restaurants/${restaurantId}/menu/`);
  }
  
  // Products
  async getProducts(restaurantId: string, categoryId?: string) {
    if (categoryId) {
      console.log(`📦 Получение продуктов категории ID: ${categoryId}`);
      return this.request(`/categories/${categoryId}/products/`);
    }
    console.log(`📦 Получение всех продуктов ресторана ID: ${restaurantId}`);
    return this.request(`/restaurants/${restaurantId}/menu/`);
  }
  
  async getProduct(productId: string) {
    console.log(`📦 Получение продукта ID: ${productId}`);
    return this.request(`/products/${productId}/`);
  }
  
  // User
  async getUser() {
    console.log('👤 Получение данных пользователя');
    return this.request('/profile/');
  }
  
  async updateUser(userData: Partial<any>) {
    console.log('✏️ Обновление данных пользователя', userData);
    return this.request('/profile/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
  
  // Addresses
  async getAddresses() {
    console.log('📍 Получение списка адресов');
    return this.request('/addresses/');
  }
  
  async createAddress(addressData: any) {
    console.log('➕ Создание нового адреса', addressData);
    return this.request('/addresses/', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }
  
  async updateAddress(addressId: string, addressData: any) {
    console.log(`✏️ Обновление адреса ID: ${addressId}`, addressData);
    return this.request(`/addresses/${addressId}/`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  }
  
  async deleteAddress(addressId: string) {
    console.log(`🗑️ Удаление адреса ID: ${addressId}`);
    return this.request(`/addresses/${addressId}/`, {
      method: 'DELETE',
    });
  }
  
  // Orders
  async getOrders() {
    console.log('📋 Получение списка заказов');
    return this.request('/profile/orders/');
  }
  
  async getOrder(orderId: string) {
    console.log(`📦 Получение заказа ID: ${orderId}`);
    return this.request(`/orders/${orderId}/`);
  }
  
  async createOrder(orderData: any) {
    console.log('🛒 Создание нового заказа', orderData);
    return this.request('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }
  
  // Cart
  async getCart() {
    console.log('🛍️ Получение корзины');
    return this.request('/cart/');
  }
  
  async addToCart(itemData: any) {
    console.log('➕ Добавление в корзину', itemData);
    return this.request('/cart/add/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }
  
  async updateCartItem(itemId: string, quantity: number) {
    console.log(`✏️ Обновление элемента корзины ID: ${itemId}`, { quantity });
    return this.request(`/cart/update/${itemId}/`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }
  
  async removeFromCart(itemId: string) {
    console.log(`🗑️ Удаление из корзины ID: ${itemId}`);
    return this.request(`/cart/remove/${itemId}/`, {
      method: 'DELETE',
    });
  }
  
  async clearCart() {
    console.log('🧹 Очистка корзины');
    return this.request('/cart/clear/', {
      method: 'DELETE',
    });
  }
  
  // Promotions
  async getPromotions() {
    console.log('🎉 Получение актуальных акций');
    return this.request('/promo/active/');
  }
  
  // Branches
  async getBranches(restaurantId: string) {
    console.log(`🏪 Получение филиалов ресторана ID: ${restaurantId}`);
    return this.request(`/restaurants/${restaurantId}/branches/`);
  }
}

export const apiClient = new ApiClient();

// Для удобства отладки, добавляем глобальный доступ к логам в development режиме
if (process.env.NODE_ENV === 'development') {
  (window as any).apiLogs = apiClient.getLogs.bind(apiClient);
  (window as any).apiClient = apiClient;
}