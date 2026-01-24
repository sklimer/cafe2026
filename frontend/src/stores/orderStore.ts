import { create } from 'zustand';
import { Order, OrderTracking, OrderStatus } from '../types';

interface OrderState {
  currentOrder: Order | null;
  orderHistory: Order[];
  loading: boolean;

  // Actions
  createOrder: (orderData: any) => Promise<Order>; // В реальной реализации будет CreateOrderDto
  cancelOrder: (orderId: string) => Promise<void>;
  trackOrder: (orderId: string) => Promise<OrderTracking>;

  // Getters
  activeOrders: Order[];
  completedOrders: Order[];
  totalSpent: number;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  currentOrder: null,
  orderHistory: [],
  loading: false,

  createOrder: async (orderData: any) => {
    set({ loading: true });
    
    try {
      // Здесь будет вызов API для создания заказа
      // Пока что используем заглушку
      
      // Создаем mock заказ
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        userId: 'user_123',
        restaurantId: orderData.restaurantId,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        bonusUsed: orderData.bonusUsed || 0,
        promoCodeApplied: orderData.promoCodeApplied,
        discountAmount: orderData.discountAmount || 0,
        deliveryFee: orderData.deliveryFee || 150,
        finalAmount: orderData.finalAmount,
        type: orderData.type || 'delivery',
        status: 'created',
        address: orderData.address,
        branch: orderData.branch,
        contactName: orderData.contactName,
        contactPhone: orderData.contactPhone,
        comment: orderData.comment,
        callPreferences: orderData.callPreferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Добавляем заказ в историю
      const updatedHistory = [newOrder, ...get().orderHistory];
      
      set({ 
        currentOrder: newOrder, 
        orderHistory: updatedHistory, 
        loading: false 
      });

      return newOrder;
    } catch (error) {
      console.error('Create order failed:', error);
      set({ loading: false });
      throw error;
    }
  },

  cancelOrder: async (orderId: string) => {
    set({ loading: true });
    
    try {
      // Здесь будет вызов API для отмены заказа
      // Пока что просто обновляем статус в истории
      
      const updatedHistory = get().orderHistory.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      );
      
      set({ 
        orderHistory: updatedHistory, 
        loading: false 
      });
    } catch (error) {
      console.error('Cancel order failed:', error);
      set({ loading: false });
      throw error;
    }
  },

  trackOrder: async (orderId: string) => {
    set({ loading: true });
    
    try {
      // Здесь будет вызов API для отслеживания заказа
      // Пока что используем заглушку
      
      const order = get().orderHistory.find(o => o.id === orderId) || get().currentOrder;
      
      if (!order) {
        throw new Error(`Order with id ${orderId} not found`);
      }

      // Mock данные для отслеживания
      const trackingData: OrderTracking = {
        orderId,
        status: order.status,
        statusHistory: [
          { status: 'created', timestamp: order.createdAt, comment: 'Заказ создан' },
          { status: 'confirmed', timestamp: new Date(Date.now() + 300000).toISOString(), comment: 'Заказ подтвержден' },
          { status: 'preparing', timestamp: new Date(Date.now() + 600000).toISOString(), comment: 'Заказ готовится' }
        ],
        estimatedDeliveryTime: new Date(Date.now() + 1800000).toISOString() // 30 минут
      };

      set({ loading: false });
      return trackingData;
    } catch (error) {
      console.error('Track order failed:', error);
      set({ loading: false });
      throw error;
    }
  },

  // Computed properties
  get activeOrders() {
    return get().orderHistory.filter(order => 
      ['created', 'confirmed', 'preparing', 'ready_for_pickup', 'on_the_way'].includes(order.status)
    );
  },
  
  get completedOrders() {
    return get().orderHistory.filter(order => 
      ['delivered', 'cancelled', 'refunded'].includes(order.status)
    );
  },
  
  get totalSpent() {
    return get().orderHistory
      .filter(order => ['delivered', 'completed'].includes(order.status))
      .reduce((sum, order) => sum + order.finalAmount, 0);
  }
}));