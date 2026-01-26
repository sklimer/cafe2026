
import { ApiResponse } from '../types';

const API_BASE_URL = '/api'; // Will be proxied through Vite dev server

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;

      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      const config: RequestInit = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      };

      // Add Telegram authentication if available
      const telegramUser = window.Telegram?.WebApp?.initData;
      if (telegramUser) {
        config.headers = {
          ...config.headers,
          'X-Telegram-Init-Data': telegramUser,
        };
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
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
    // Using the dedicated endpoint for restaurant menu that includes categories and products
    return this.request(`/restaurants/${restaurantId}/menu/`);
  }

  // Products
  async getProducts(restaurantId: string, categoryId?: string) {
    if (categoryId) {
      return this.request(`/categories/${categoryId}/products/`);
    }
    // If no category specified, get all products for restaurant via menu endpoint
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