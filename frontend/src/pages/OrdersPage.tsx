import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../stores/orderStore';

// Mock data
const mockOrders = [
  {
    id: 'ORD-2024-001234',
    userId: 'user1',
    restaurantId: 'rest1',
    items: [],
    totalAmount: 1250,
    bonusUsed: 0,
    promoCodeApplied: undefined,
    discountAmount: 0,
    deliveryFee: 150,
    finalAmount: 1250,
    type: 'delivery' as const,
    status: 'on_the_way' as const,
    address: {
      id: 'addr1',
      userId: 'user1',
      type: 'home',
      street: 'ул. Примерная',
      building: '10',
      apartment: '25',
      label: 'Дом',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    contactName: 'Иван Иванов',
    contactPhone: '+7 (999) 123-45-67',
    comment: '',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 1800000).toISOString() // 30 mins ago
  },
  {
    id: 'ORD-2024-001233',
    userId: 'user1',
    restaurantId: 'rest1',
    items: [],
    totalAmount: 850,
    bonusUsed: 0,
    promoCodeApplied: undefined,
    discountAmount: 0,
    deliveryFee: 0,
    finalAmount: 850,
    type: 'pickup' as const,
    status: 'delivered' as const,
    branch: {
      id: 'branch1',
      restaurantId: 'rest1',
      name: 'Центральный филиал',
      address: 'ул. Центральная, 1',
      phone: '+7 (999) 123-45-67',
      workTime: '9:00-23:00',
      coordinates: [55.7558, 37.6176],
      isDeliveryAvailable: true,
      deliveryRadius: 5,
      isActive: true
    },
    contactName: 'Иван Иванов',
    contactPhone: '+7 (999) 123-45-67',
    comment: '',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 82800000).toISOString() // 23 hours ago
  }
];

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrders, completedOrders } = useOrderStore();
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'completed'>('all');

  const orders = activeTab === 'active' ? activeOrders : 
                activeTab === 'completed' ? completedOrders : 
                [...activeOrders, ...completedOrders].sort((a, b) => 
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="pb-20">
      {/* Шапка */}
      <div className="sticky top-0 z-10 bg-white shadow-sm p-4 flex items-center justify-between">
        <button 
          className="text-gray-500 mr-2"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h1 className="text-lg font-bold truncate flex-1 text-center">Мои заказы</h1>
        <div className="ml-2 w-8"></div> {/* Для выравнивания */}
      </div>

      <div className="p-4">
        {/* Табы */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-center ${
              activeTab === 'active' ? 'bg-white shadow-sm' : ''
            }`}
            onClick={() => setActiveTab('active')}
          >
            Активные
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-center ${
              activeTab === 'all' ? 'bg-white shadow-sm' : ''
            }`}
            onClick={() => setActiveTab('all')}
          >
            Все
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-center ${
              activeTab === 'completed' ? 'bg-white shadow-sm' : ''
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Завершенные
          </button>
        </div>

        {/* Список заказов */}
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Нет заказов
            </div>
          ) : (
            orders.map(order => (
              <div 
                key={order.id} 
                className="bg-white rounded-xl p-4 border border-gray-200"
                onClick={() => navigate(`/order/${order.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">#{order.id}</div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span>
                        {order.type === 'delivery' ? '🚚 Доставка' : '🏪 Самовывоз'} • {new Date(order.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {order.type === 'delivery' && order.address && (
                      <div className="text-sm text-gray-600 mt-1">📍 {order.address.street}, {order.address.building}</div>
                    )}
                    {order.type === 'pickup' && order.branch && (
                      <div className="text-sm text-gray-600 mt-1">🏪 {order.branch.name}</div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{order.finalAmount}₽</div>
                    <div className="flex items-center mt-1">
                      {order.status === 'created' && <span className="text-yellow-600">⏳</span>}
                      {order.status === 'confirmed' && <span className="text-blue-600">✅</span>}
                      {order.status === 'preparing' && <span className="text-blue-600">🍳</span>}
                      {order.status === 'ready_for_pickup' && <span className="text-blue-600">📦</span>}
                      {order.status === 'on_the_way' && <span className="text-green-600">🚚</span>}
                      {order.status === 'delivered' && <span className="text-green-600">✅</span>}
                      {order.status === 'cancelled' && <span className="text-red-600">❌</span>}
                      {order.status === 'refunded' && <span className="text-gray-600">↩️</span>}
                      <span className="ml-1 text-sm">
                        {order.status === 'created' && 'Создан'}
                        {order.status === 'confirmed' && 'Подтверждён'}
                        {order.status === 'preparing' && 'Готовится'}
                        {order.status === 'ready_for_pickup' && 'Готов к выдаче'}
                        {order.status === 'on_the_way' && 'Доставляется'}
                        {order.status === 'delivered' && 'Доставлен'}
                        {order.status === 'cancelled' && 'Отменён'}
                        {order.status === 'refunded' && 'Возвращён'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <button className="text-blue-500 text-sm flex items-center">
                    Подробнее →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;