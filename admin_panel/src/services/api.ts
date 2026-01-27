// API service for admin panel
import axios from 'axios';
import { env } from '../config/env';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: env.REACT_APP_API_URL || '/api/', // Use environment variable or default - API is under /api/v1
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get CSRF token
export const getCsrfToken = async (): Promise<string> => {
  try {
    // Use a separate axios instance to get CSRF token since it might have different base URL requirements
    const csrfAxios = axios.create({
      baseURL: env.REACT_APP_API_URL || '/api/',
      withCredentials: true
    });
    const response = await csrfAxios.get('auth/csrf/');
    return response.data.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    // Return empty string if CSRF token is not available
    return '';
  }
};

// Store CSRF token
let csrfToken: string | null = null;

// Add request interceptor to include credentials and CSRF token (for session authentication)
api.interceptors.request.use(
  async (config) => {
    // Include credentials (cookies) for session authentication
    config.withCredentials = true;

    // Add CSRF token to headers for mutating requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      if (!csrfToken) {
        csrfToken = await getCsrfToken();
      }

      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }

    // Не устанавливаем Content-Type для FormData (браузер сделает это сам)
    // Проверяем, является ли data FormData
    if (config.data instanceof FormData) {
      // Удаляем Content-Type, чтобы браузер установил правильный с boundary
      delete config.headers['Content-Type'];
    } else if (typeof config.data === 'object' && config.data !== null) {
      // Для JSON объектов устанавливаем правильный Content-Type
      config.headers['Content-Type'] = 'application/json';
      config.data = JSON.stringify(config.data);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle unauthorized access - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard API endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentOrders: () => api.get('/dashboard/recent-orders'),
  getPopularProducts: () => api.get('/dashboard/popular-products'),
  getRevenueChart: (period: string) => api.get(`/dashboard/revenue-chart?period=${period}`),
};

// Orders API endpoints
export const ordersAPI = {
  getAll: (params?: any) => api.get('/orders', params),
  getById: (id: number) => api.get(`/orders/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/orders/${id}/status/`, { status }),
  bulkUpdateStatus: (ids: number[], status: string) => api.put('/orders/bulk-status/', { ids, status }),
  create: (data: any) => api.post('/orders/', data),
  delete: (id: number) => api.delete(`/orders/${id}/`),
};

// Menu API endpoints
export const menuAPI = {
  getProducts: (params?: any) => api.get('/products', params),
  getProductById: (id: number) => api.get(`/products/${id}`),
  createProduct: (data: any) => {
    const isFormData = data instanceof FormData;

    const config = {
      headers: isFormData ? {
        'X-CSRFToken': csrfToken
      } : {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      }
    };

    return api.post('/products/', isFormData ? data : JSON.stringify(data), config);
  },
  updateProduct: (id: number, data: any) => {
    // Проверяем, является ли data FormData (при загрузке файлов)
    const isFormData = data instanceof FormData;

    // Создаем отдельную конфигурацию для FormData
    const config = {
      headers: isFormData ? {
        // Для FormData браузер сам установит правильный Content-Type с boundary
        // Не устанавливаем Content-Type вручную для FormData
        'X-CSRFToken': csrfToken
      } : {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      }
    };

    // Для FormData отправляем как есть, для JSON - строкифицируем
    return api.put(`/products/${id}/`, isFormData ? data : JSON.stringify(data), config);
  },
  patchProduct: (id: number, data: any) => api.patch(`/products/${id}/`, data),
  deleteProduct: (id: number) => api.delete(`/products/${id}/`),

  getCategories: () => api.get('/categories'),
  getCategoryById: (id: number) => api.get(`/categories/${id}`),
  createCategory: (data: any) => api.post('/categories/', data),
  updateCategory: (id: number, data: any) => api.put(`/categories/${id}/`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}/`),
};

// Users API endpoints
export const usersAPI = {
  getAll: (params?: any) => api.get('/users', params),
  getById: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: any) => api.put(`/users/${id}/`, data),
  bulkUpdate: (ids: number[], data: any) => api.put('/users/bulk/', { ids, data }),
  create: (data: any) => api.post('/users/', data),
  delete: (id: number) => api.delete(`/users/${id}/`),
  toggleBlock: (id: number, blocked: boolean) => api.patch(`/users/${id}/block/`, { blocked }),
};

// Restaurants API endpoints
export const restaurantsAPI = {
  getAll: (params?: any) => api.get('/admin/restaurants', params),
  getById: (id: number) => api.get(`/admin/restaurants/${id}`),
  update: (id: number, data: any) => api.put(`/admin/restaurants/${id}/`, data),
  create: (data: any) => api.post('/admin/restaurants/', data),
  delete: (id: number) => api.delete(`/admin/restaurants/${id}/`),
  verify: (id: number, verified: boolean) => api.patch(`/admin/restaurants/${id}/verify/`, { verified }),
};

// Promotions API endpoints
export const promotionsAPI = {
  getAll: (params?: any) => api.get('/promotions', params),
  getById: (id: number) => api.get(`/promotions/${id}`),
  create: (data: any) => api.post('/promotions/', data),
  update: (id: number, data: any) => api.put(`/promotions/${id}/`, data),
  delete: (id: number) => api.delete(`/promotions/${id}/`),
  toggleActivation: (id: number, active: boolean) => api.patch(`/promotions/${id}/activate/`, { active }),
};

// Analytics API endpoints
export const analyticsAPI = {
  getStats: (params?: any) => api.get('/analytics/stats', params),
  getRevenueData: (params?: any) => api.get('/analytics/revenue', params),
  getOrdersData: (params?: any) => api.get('/analytics/orders', params),
  getTopProducts: (params?: any) => api.get('/analytics/top-products', params),
  getTopRestaurants: (params?: any) => api.get('/analytics/top-restaurants', params),
  exportReport: (params?: any) => api.get('/analytics/export', params),
};

export default api;