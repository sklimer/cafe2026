import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../stores/orderStore';

// Mock data
const mockOrder = {
  id: 'ORD-2024-001234',
  userId: 'user1',
  restaurantId: 'rest1',
  items: [
    {
      productId: 'prod1',
      product: {
        id: 'prod1',
        name: 'Пицца Маргарита',
        description: 'Итальянская классика с томатами и моцареллой',
        price: 450,
        image: '',
        weight: 500,
        categoryId: 'cat1',
        restaurantId: 'rest1',
        tags: [],
        options: [],
        isPopular: true,
        isNew: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      quantity: 1,
      selectedOptions: [
        { optionId: 'size', valueId: 'size_medium' },
        { optionId: 'extra', valueId: 'cheese' }
      ],
      price: 600 // 450 + 100(size) + 50(extra)
    },
    {
      productId: 'prod2',
      product: {
        id: 'prod2',
        name: 'Кофе латте',
        description: 'Классический кофе с молоком',
        price: 150,
        image: '',
        weight: 300,
        categoryId: 'cat4',
        restaurantId: 'rest1',
        tags: [],
        options: [],
        isPopular: false,
        isNew: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      quantity: 2,
      selectedOptions: [
        { optionId: 'milk', valueId: 'coconut' }
      ],
      price: 170 // 150 + 20(milk)
    }
  ],
  totalAmount: 850,
  bonusUsed: 50,
  promoCodeApplied: 'SUMMER10',
  discountAmount: 100,
  deliveryFee: 150,
  finalAmount: 850,
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
  comment: 'Позвонить за час',
  callPreferences: 'call' as const,
  createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  updatedAt: new Date(Date.now() - 1800000).toISOString() // 30 mins ago
};

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { trackOrder } = useOrderStore();

  // В реальной реализации мы бы получили заказ по ID
  const order = mockOrder;

  // Моковая функция отслеживания
  const tracking = {
    orderId: order.id,
    status: order.status,
    statusHistory: [
      { status: 'created' as const, timestamp: new Date(Date.now() - 3600000).toISOString(), comment: 'Заказ создан' },
      { status: 'confirmed' as const, timestamp: new Date(Date.now() - 3000000).toISOString(), comment: 'Заказ подтвержден' },
      { status: 'preparing' as const, timestamp: new Date(Date.now() - 1800000).toISOString(), comment: 'Заказ готовится' },
      { status: 'on_the_way' as const, timestamp: new Date(Date.now() - 600000).toISOString(), comment: 'Заказ в пути' }
    ],
    estimatedDeliveryTime: new Date(Date.now() + 1200000).toISOString() // 20 minutes
  };

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
        <h1 className="text-lg font-bold truncate flex-1 text-center">
          Заказ #{order.id}
        </h1>
        <div className="ml-2 w-8"></div> {/* Для выравнивания */}
      </div>

      <div className="p-4">
        {/* Статус заказа */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">Статус:</span>
            <span className="flex items-center">
              {order.status === 'created' && <span className="text-yellow-600 mr-2">⏳</span>}
              {order.status === 'confirmed' && <span className="text-blue-600 mr-2">✅</span>}
              {order.status === 'preparing' && <span className="text-blue-600 mr-2">🍳</span>}
              {order.status === 'ready_for_pickup' && <span className="text-blue-600 mr-2">📦</span>}
              {order.status === 'on_the_way' && <span className="text-green-600 mr-2">🚚</span>}
              {order.status === 'delivered' && <span className="text-green-600 mr-2">✅</span>}
              {order.status === 'cancelled' && <span className="text-red-600 mr-2">❌</span>}
              {order.status === 'refunded' && <span className="text-gray-600 mr-2">↩️</span>}
              <span>
                {order.status === 'created' && 'Создан'}
                {order.status === 'confirmed' && 'Подтверждён'}
                {order.status === 'preparing' && 'Готовится'}
                {order.status === 'ready_for_pickup' && 'Готов к выдаче'}
                {order.status === 'on_the_way' && 'Доставляется'}
                {order.status === 'delivered' && 'Доставлен'}
                {order.status === 'cancelled' && 'Отменён'}
                {order.status === 'refunded' && 'Возвращён'}
              </span>
            </span>
          </div>

          {/* Прогресс статуса */}
          <div className="flex items-center justify-between text-xs text-gray-500 relative">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${tracking.statusHistory.some(h => h.status === 'created') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1">Создан</span>
            </div>
            <div className={`absolute left-1/4 w-1/4 h-0.5 ${tracking.statusHistory.some(h => ['confirmed', 'preparing', 'ready_for_pickup', 'on_the_way', 'delivered'].includes(h.status)) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${tracking.statusHistory.some(h => ['confirmed', 'preparing', 'ready_for_pickup', 'on_the_way', 'delivered'].includes(h.status)) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1">Подтверждён</span>
            </div>
            <div className={`absolute left-2/4 w-1/4 h-0.5 ${tracking.statusHistory.some(h => ['preparing', 'ready_for_pickup', 'on_the_way', 'delivered'].includes(h.status)) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${tracking.statusHistory.some(h => ['preparing', 'ready_for_pickup', 'on_the_way', 'delivered'].includes(h.status)) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1">Готовится</span>
            </div>
            <div className={`absolute left-3/4 w-1/4 h-0.5 ${tracking.statusHistory.some(h => ['on_the_way', 'delivered'].includes(h.status)) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${tracking.statusHistory.some(h => ['on_the_way', 'delivered'].includes(h.status)) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1">Доставляется</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${tracking.statusHistory.some(h => h.status === 'delivered') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1">Доставлен</span>
            </div>
          </div>
        </div>

        {/* Состав заказа */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <h3 className="font-medium mb-3">Состав заказа:</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between">
                  <span>{item.product.name} ×{item.quantity}</span>
                  <span>{item.price * item.quantity}₽</span>
                </div>
                
                {item.selectedOptions.length > 0 && (
                  <div className="text-sm text-gray-600 mt-1 ml-4">
                    {item.selectedOptions.map(opt => {
                      const optionDef = item.product.options.find(o => o.id === opt.optionId);
                      const value = optionDef?.values.find(v => v.id === opt.valueId);
                      return value ? `- ${value.name}${value.priceDelta > 0 ? ` (+${value.priceDelta}₽)` : ''}` : '';
                    }).filter(Boolean).join('\n')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Адрес доставки */}
        {order.type === 'delivery' && order.address && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <h3 className="font-medium mb-3">Адрес доставки:</h3>
            <div className="text-sm">
              <div>{order.address.street}, {order.address.building}{order.address.apartment ? `, кв. ${order.address.apartment}` : ''}</div>
              {order.contactPhone && (
                <div className="mt-2">Курьер: {order.contactName} {order.contactPhone}</div>
              )}
              {tracking.estimatedDeliveryTime && (
                <div className="mt-2">Примерное время: {new Date(tracking.estimatedDeliveryTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
              )}
            </div>
          </div>
        )}

        {/* Информация об оплате */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <h3 className="font-medium mb-3">Оплата:</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Сумма товаров:</span>
              <span>{order.totalAmount}₽</span>
            </div>
            {order.type === 'delivery' && (
              <div className="flex justify-between">
                <span>Доставка:</span>
                <span>{order.deliveryFee}₽</span>
              </div>
            )}
            {order.promoCodeApplied && (
              <div className="flex justify-between text-green-600">
                <span>Скидка по промокоду:</span>
                <span>-{order.discountAmount}₽</span>
              </div>
            )}
            {order.bonusUsed > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Бонусы использовано:</span>
                <span>-{order.bonusUsed * 10}₽</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>ИТОГО:</span>
              <span>{order.finalAmount}₽</span>
            </div>
          </div>
        </div>

        {/* Комментарий */}
        {order.comment && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <h3 className="font-medium mb-3">Комментарий:</h3>
            <div className="text-sm">{order.comment}</div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="space-y-3">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium">
            Связаться с поддержкой
          </button>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium">
            Повторить заказ
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;