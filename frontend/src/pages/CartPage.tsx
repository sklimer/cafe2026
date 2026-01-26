
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalItems, subtotal, clearCart, removeItem, updateQuantity } = useCartStore();

  const handleCheckout = () => {
    if (items.length > 0) {
      navigate('/checkout');
    }
  };

  const handleBack = () => {
    navigate(-1); // Вернуться на предыдущую страницу
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={handleBack}
              className="text-blue-600 font-medium"
            >
              Назад
            </button>
            <h1 className="text-lg font-semibold">Корзина</h1>
            <div className="w-16"></div> {/* Placeholder для выравнивания */}
          </div>
        </header>

        {/* Empty cart */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ваша корзина пуста</h2>
          <p className="text-gray-600 mb-6">Добавьте товары в корзину, чтобы увидеть их здесь</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Перейти к покупкам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleBack}
            className="text-blue-600 font-medium"
          >
            Назад
          </button>
          <h1 className="text-lg font-semibold">Корзина</h1>
          <div className="w-16"></div> {/* Placeholder для выравнивания */}
        </div>
      </header>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 mb-3 mx-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-800">{item.product.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.price.toFixed(2)} ₽ × {item.quantity}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-2 text-red-500"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              <p className="mt-2 font-semibold text-gray-800">{(item.price * item.quantity).toFixed(2)} ₽</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom panel with totals and checkout button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600">Товаров: {totalItems}</span>
            <span className="text-lg font-semibold">{subtotal.toFixed(2)} ₽</span>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={clearCart}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
            >
              Очистить
            </button>
            <button
              onClick={handleCheckout}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Перейти к заказу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;