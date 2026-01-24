import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useOrderStore } from '../stores/orderStore';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();
  const [step, setStep] = useState<number>(1); // 1 - тип заказа, 2 - адрес/филиал, 3 - контактные данные, 4 - бонусы/промокод, 5 - подтверждение
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [contactName, setContactName] = useState<string>('Иван Иванов');
  const [contactPhone, setContactPhone] = useState<string>('+7 (999) 123-45-67');
  const [comment, setComment] = useState<string>('');
  const [useBonus, setUseBonus] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string, discount: number} | null>(null);

  // Моковые данные для примера
  const bonusBalance = 150; // баллов
  const deliveryFee = 150;
  const minForFreeDelivery = 1500;

  // Вычисляем итоговую сумму
  let totalAmount = subtotal + (orderType === 'delivery' ? deliveryFee : 0);
  if (appliedPromo) {
    totalAmount -= appliedPromo.discount;
  }
  const maxBonusToUse = Math.min(bonusBalance, Math.floor(totalAmount * 0.1)); // максимум 10% от заказа
  totalAmount -= Math.min(useBonus, maxBonusToUse) * 10; // 1 балл = 10 рублей

  const handleApplyPromo = () => {
    // В реальной реализации это будет вызов API
    if (promoCode === 'SUMMER10') {
      setAppliedPromo({ code: promoCode, discount: 100 });
    } else {
      alert('Промокод не найден или недействителен');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      // В реальной реализации отправляем заказ на сервер
      const orderData = {
        restaurantId: 'rest1', // В реальной реализации получим из корзины
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          price: item.price
        })),
        totalAmount: subtotal,
        bonusUsed: useBonus,
        promoCodeApplied: appliedPromo?.code,
        discountAmount: appliedPromo ? appliedPromo.discount : 0,
        deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
        finalAmount: totalAmount,
        type: orderType,
        address: orderType === 'delivery' ? {} : undefined, // В реальной реализации получим из формы
        branch: orderType === 'pickup' ? {} : undefined, // В реальной реализации получим из формы
        contactName,
        contactPhone,
        comment
      };

      await createOrder(orderData);
      clearCart(); // Очищаем корзину после успешного заказа
      navigate('/orders'); // Переходим к списку заказов
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Ошибка при оформлении заказа');
    }
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
          Оформление заказа ({step}/5)
        </h1>
        <div className="ml-2 w-8"></div> {/* Для выравнивания */}
      </div>

      <div className="p-4">
        {step === 1 && (
          <div>
            <h2 className="font-medium mb-4">Выберите тип заказа</h2>
            
            <div className="space-y-3 mb-6">
              <div 
                className={`p-4 rounded-xl border-2 ${
                  orderType === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setOrderType('delivery')}
              >
                <div className="flex items-center">
                  <div className="mr-3 text-2xl">🚚</div>
                  <div className="flex-1">
                    <h3 className="font-medium">Доставка</h3>
                    <p className="text-sm text-gray-600">Курьер доставит заказ по адресу</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    orderType === 'delivery' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {orderType === 'delivery' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 rounded-xl border-2 ${
                  orderType === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setOrderType('pickup')}
              >
                <div className="flex items-center">
                  <div className="mr-3 text-2xl">🏪</div>
                  <div className="flex-1">
                    <h3 className="font-medium">Самовывоз</h3>
                    <p className="text-sm text-gray-600">Заберите заказ в филиале</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    orderType === 'pickup' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {orderType === 'pickup' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
              onClick={() => setStep(2)}
            >
              Продолжить
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-medium mb-4">Контактные данные</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Имя</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Иван Иванов"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="+7 (999) 123-45-67"
                />
                <p className="text-xs text-gray-500 mt-1">для связи с курьером</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Комментарий</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Введите комментарий к заказу"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span>Позвонить за час до доставки</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span>Не звонить, напишите в Telegram</span>
                </label>
              </div>
            </div>
            
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
              onClick={() => setStep(4)}
            >
              Продолжить
            </button>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span>Сумма заказа:</span>
                <span>{subtotal}₽</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between mb-2">
                  <span>Доставка:</span>
                  <span>{deliveryFee}₽</span>
                </div>
              )}
              {appliedPromo && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Промокод "{appliedPromo.code}":</span>
                  <span>-{appliedPromo.discount}₽</span>
                </div>
              )}
              {useBonus > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Бонусы ({useBonus} баллов):</span>
                  <span>-{useBonus * 10}₽</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Итого к оплате:</span>
                <span>{totalAmount}₽</span>
              </div>
            </div>
            
            {/* Бонусы */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">💰 Бонусный баланс</h3>
                <span className="text-yellow-700">{bonusBalance} баллов</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Можно списать: до {maxBonusToUse} баллов ({maxBonusToUse * 10}₽)
              </p>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max={maxBonusToUse}
                  value={useBonus}
                  onChange={(e) => setUseBonus(parseInt(e.target.value))}
                  className="flex-1 mr-3"
                />
                <input
                  type="number"
                  min="0"
                  max={maxBonusToUse}
                  value={useBonus}
                  onChange={(e) => setUseBonus(Math.min(maxBonusToUse, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-20 p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            {/* Промокод */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-medium mb-3">🎫 Промокод</h3>
              <div className="flex">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Введите промокод"
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg"
                />
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg"
                  onClick={handleApplyPromo}
                >
                  Применить
                </button>
              </div>
              {appliedPromo && (
                <div className="mt-3 p-2 bg-green-100 text-green-800 rounded-lg flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Промокод "{appliedPromo.code}" применен -{appliedPromo.discount}₽</span>
                </div>
              )}
            </div>
            
            {/* Информация о доставке */}
            {orderType === 'delivery' && totalAmount < minForFreeDelivery && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <p className="text-orange-700 text-sm">
                  🚚 Доставка бесплатна от: {minForFreeDelivery}₽<br/>
                  Добавьте товаров на {minForFreeDelivery - totalAmount}₽
                </p>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium"
                onClick={() => setStep(3)}
              >
                Назад
              </button>
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
                onClick={() => setStep(5)}
              >
                Продолжить
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="font-medium mb-4">Подтверждение заказа</h2>
            
            {/* Сводка заказа */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h3 className="font-medium mb-3">Состав заказа:</h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <span>{item.product.name} ×{item.quantity}</span>
                      <div className="text-gray-500">
                        {item.selectedOptions.map(opt => {
                          const optionDef = item.product.options.find(o => o.id === opt.optionId);
                          const value = optionDef?.values.find(v => v.id === opt.valueId);
                          return value ? value.name : '';
                        }).filter(Boolean).join(', ')}
                      </div>
                    </div>
                    <span>{item.price * item.quantity}₽</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span>Сумма заказа:</span>
                <span>{subtotal}₽</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between mb-2">
                  <span>Доставка:</span>
                  <span>{deliveryFee}₽</span>
                </div>
              )}
              {appliedPromo && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Промокод:</span>
                  <span>-{appliedPromo.discount}₽</span>
                </div>
              )}
              {useBonus > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Бонусы:</span>
                  <span>-{useBonus * 10}₽</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Итого:</span>
                <span>{totalAmount}₽</span>
              </div>
            </div>
            
            <button
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium"
              onClick={handlePlaceOrder}
            >
              Подтвердить заказ
            </button>
          </div>
        )}
        
        {step !== 1 && step !== 5 && step !== 4 && step !== 3 && (
          <div className="text-center py-10 text-gray-500">
            Шаг {step} еще не реализован в этом демо
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;