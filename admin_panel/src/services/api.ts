// API service for admin panel
import axios from 'axios';
import { env } from '../config/env';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: env.REACT_APP_API_URL || 'http://localhost:8000/api/',
  timeout: 10000,
  withCredentials: true,
});

// Убираем CSRF логику, так как она вызывает 404
// Для сессионной аутентификации Django обычно использует csrftoken из куки
// Добавляем только заголовок X-CSRFToken, если токен есть в куках

// Функция для получения CSRF токена из куки
const getCsrfTokenFromCookie = (): string | null => {
  const name = 'csrftoken';
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1];
  return cookieValue || null;
};

// Add request interceptor to include CSRF token
api.interceptors.request.use(
  (config) => {
    // Добавляем CSRF токен только для мутирующих запросов
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
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
  getProducts: (params?: any) => {
    // Поддержка параметров пагинации
    const queryParams = new URLSearchParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key].toString());
        }
      });
    }

    const url = queryParams.toString() ? `/products/?${queryParams.toString()}` : '/products/';
    return api.get(url);
  },
  getProductById: (id: number) => api.get(`/products/${id}`),
  createProduct: (data: any) => api.post('/products/', data),
  updateProduct: (id: number, data: any) => api.put(`/products/${id}/`, data),
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
  getAll: (params?: any) => api.get('/users/', params),  // добавил слэш в конце
  getById: (id: number) => api.get(`/users/${id}/`),
  update: (id: number, data: any) => api.put(`/users/${id}/`, data),
  bulkUpdate: (ids: number[], data: any) => api.put('/users/bulk_action/', { ids, ...data }), // изменил путь
  create: (data: any) => api.post('/users/', data),
  delete: (id: number) => api.delete(`/users/${id}/`),
  toggleBlock: (id: number, blocked: boolean) => api.patch(`/users/${id}/block/`, { blocked }),
  bulkAction: (ids: number[], action: string) => api.post('/users/bulk_action/', { ids, action }), // добавил новый метод
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