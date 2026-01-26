
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../stores/orderStore';
import { apiClient } from '../api/client';
import { useQuery } from '@tanstack/react-query';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'completed'>('all');

  // Загружаем заказы из API
  const {
    data: ordersData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await apiClient.getOrders();
      if (res.success && res.data) {
        // Check if response is paginated (has results field)
        if (res.data.results !== undefined) {
          return res.data.results;
        } else {
          // If not paginated, return the data directly
          return res.data;
        }
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const allOrders = ordersData || [];

  // Фильтруем заказы по статусу
  const activeOrders = allOrders.filter(order =>
    ['created', 'confirmed', 'preparing', 'ready_for_pickup', 'on_the_way'].includes(order.status)
  );

  const completedOrders = allOrders.filter(order =>
    ['delivered', 'cancelled', 'refunded'].includes(order.status)
  );

  const orders = activeTab === 'active' ? activeOrders :
                activeTab === 'completed' ? completedOrders :
                [...activeOrders, ...completedOrders].sort((a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Показываем индикатор загрузки если данные еще не загружены
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Показываем ошибку если произошла ошибка загрузки
  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        Ошибка загрузки данных: {(error as Error)?.message || 'Не удалось загрузить заказы'}
      </div>
    );
  }

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