// API service for admin panel
import axios from 'axios';
import { env } from '../config/env';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: env.REACT_APP_API_URL || '/api/v1', // Use environment variable or default - API is under /api/v1
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token'); // Get token from local storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('admin_token');
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
  updateStatus: (id: number, status: string) => api.put(`/orders/${id}/status`, { status }),
  bulkUpdateStatus: (ids: number[], status: string) => api.put('/orders/bulk-status', { ids, status }),
  create: (data: any) => api.post('/orders', data),
  delete: (id: number) => api.delete(`/orders/${id}`),
};

// Menu API endpoints
export const menuAPI = {
  getProducts: (params?: any) => api.get('/products', params),
  getProductById: (id: number) => api.get(`/products/${id}`),
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: number, data: any) => api.put(`/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/products/${id}`),

  getCategories: () => api.get('/categories'),
  getCategoryById: (id: number) => api.get(`/categories/${id}`),
  createCategory: (data: any) => api.post('/categories', data),
  updateCategory: (id: number, data: any) => api.put(`/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),
};

// Users API endpoints
export const usersAPI = {
  getAll: (params?: any) => api.get('/users', params),
  getById: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  bulkUpdate: (ids: number[], data: any) => api.put('/users/bulk', { ids, data }),
  create: (data: any) => api.post('/users', data),
  delete: (id: number) => api.delete(`/users/${id}`),
  toggleBlock: (id: number, blocked: boolean) => api.patch(`/users/${id}/block`, { blocked }),
};

// Restaurants API endpoints
export const restaurantsAPI = {
  getAll: (params?: any) => api.get('/restaurants', params),
  getById: (id: number) => api.get(`/restaurants/${id}`),
  update: (id: number, data: any) => api.put(`/restaurants/${id}`, data),
  create: (data: any) => api.post('/restaurants', data),
  delete: (id: number) => api.delete(`/restaurants/${id}`),
  verify: (id: number, verified: boolean) => api.patch(`/restaurants/${id}/verify`, { verified }),
};

// Promotions API endpoints
export const promotionsAPI = {
  getAll: (params?: any) => api.get('/promotions', params),
  getById: (id: number) => api.get(`/promotions/${id}`),
  create: (data: any) => api.post('/promotions', data),
  update: (id: number, data: any) => api.put(`/promotions/${id}`, data),
  delete: (id: number) => api.delete(`/promotions/${id}`),
  toggleActivation: (id: number, active: boolean) => api.patch(`/promotions/${id}/activate`, { active }),
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