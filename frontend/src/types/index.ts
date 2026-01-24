// Типы для тегов
export interface Tag {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  weight: number;
  calories?: number;
  proteins?: number;
  fats?: number;
  carbs?: number;
  categoryId: string;
  restaurantId: string;
  tags: Tag[];
  options: ProductOption[];
  isPopular: boolean;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
  id: string;
  name: string;
  type: 'single' | 'multiple'; // radio или checkbox
  required: boolean;
  maxChoices?: number; // для multiple
  values: OptionValue[];
}

export interface OptionValue {
  id: string;
  name: string;
  priceDelta: number; // дополнительная стоимость
  isDefault?: boolean;
}

export interface SelectedOption {
  optionId: string;
  valueId: string;
}

// Типы для категорий
export interface Category {
  id: string;
  name: string;
  image?: string;
  restaurantId: string;
  sortOrder: number;
  isActive: boolean;
}

// Типы для ресторанов
export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  address: string;
  phone?: string;
  workTime: string;
  deliveryTime: string;
  deliveryPrice: number;
  minOrderAmount: number;
  rating?: number;
  isActive: boolean;
}

// Типы для корзины
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedOptions: SelectedOption[];
  price: number; // цена с учетом опций
}

export interface Cart {
  items: CartItem[];
  restaurantId: string | null;
  subtotal: number;
}

// Типы для пользователей
export interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bonusBalance: number;
  referralCode?: string;
  notificationSettings: NotificationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  notifications: boolean;
  promotions: boolean;
  news: boolean;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Типы для адресов
export interface Address {
  id: string;
  userId: string;
  type: 'home' | 'work' | 'other';
  street: string;
  building: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  comment?: string;
  label?: string; // 'Дом', 'Работа', или пользовательская метка
  isDefault: boolean;
  coordinates?: [number, number]; // [широта, долгота]
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  phone?: string;
  workTime: string;
  coordinates: [number, number];
  isDeliveryAvailable: boolean;
  deliveryRadius: number;
  isActive: boolean;
}

// Типы для заказов
export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  items: OrderItem[];
  totalAmount: number;
  bonusUsed: number;
  promoCodeApplied?: string;
  discountAmount: number;
  deliveryFee: number;
  finalAmount: number;
  type: 'delivery' | 'pickup';
  status: OrderStatus;
  address?: Address;
  branch?: Branch;
  contactName: string;
  contactPhone: string;
  comment?: string;
  callPreferences?: 'call' | 'message' | 'none';
  scheduledAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedOptions: SelectedOption[];
  price: number; // цена единицы с учетом опций
}

export type OrderStatus =
  | 'created'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  statusHistory: StatusHistory[];
  estimatedDeliveryTime?: string;
  courier?: CourierInfo;
}

export interface StatusHistory {
  status: OrderStatus;
  timestamp: string;
  comment?: string;
}

export interface CourierInfo {
  id: string;
  name: string;
  phone: string;
  vehicle?: string;
  rating?: number;
}

// Типы для акций
export interface Promotion {
  id: string;
  title: string;
  description: string;
  terms: string;
  startDate: string;
  endDate: string;
  image?: string;
  type: 'discount' | 'gift' | 'bonus' | 'free_delivery' | 'special';
  conditions?: PromotionConditions;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionConditions {
  minOrderAmount?: number;
  targetGroups?: ('new_users' | 'regular_customers' | 'all')[];
  maxUsesPerUser?: number;
  totalMaxUses?: number;
}

// Типы для ответов API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}