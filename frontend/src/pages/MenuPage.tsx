
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { Product, Category } from '../types';
import { apiClient } from '../api/client';
import { useQuery } from '@tanstack/react-query';

// Стили для ChatBurger-дизайна
const chatBurgerStyles = {
  headerGradient: 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-600',
  spicyBadge: 'bg-gradient-to-r from-red-600 to-orange-500',
  hitBadge: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  newbieBadge: 'bg-gradient-to-r from-green-500 to-emerald-600',
  discountBadge: 'bg-gradient-to-r from-pink-500 to-rose-600',
  sectionBg: 'bg-gradient-to-br from-orange-50 to-amber-50',
  priceColor: 'text-orange-600',
  addButton: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
};

const ChatBurgerMenu: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, subtotal, items } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showCategories, setShowCategories] = useState(true);

  // Загрузка данных
  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu'],
    queryFn: () => apiClient.getCategories().then(res => res.data),
  });

  const categories = menuData?.categories || [];
  const products = menuData?.products || [];

  // Установка активной категории
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories]);

  // Фильтрация продуктов по категории
  const productsByCategory = activeCategory
    ? products.filter(product => product.categoryId === activeCategory)
    : products; // Если нет активной категории, показываем все продукты

  // Группировка продуктов по тегам (для секций как в ChatBurger)
  const groupedProducts = productsByCategory.reduce((groups, product) => {
    const mainTag = product.tags[0]?.name || 'Другие';
    if (!groups[mainTag]) {
      groups[mainTag] = [];
    }
    groups[mainTag].push(product);
    return groups;
  }, {} as Record<string, typeof products>);

  // Добавление в корзину
  const handleAddToCart = (product: Product) => {
    addItem(product, 1, []);
  };

  // Обработчик прокрутки для скрытия/показа категорий
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowCategories(false);
      } else {
        setShowCategories(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Функция для рендеринга бейджей
  const renderBadge = (tagName: string) => {
    switch(tagName.toLowerCase()) {
      case 'острый':
        return <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${chatBurgerStyles.spicyBadge}`}>🌶️ Острый</span>;
      case 'хит':
        return <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${chatBurgerStyles.hitBadge}`}>🔥 Хит</span>;
      case 'новинка':
        return <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${chatBurgerStyles.newbieBadge}`}>🆕 Новинка</span>;
      case 'акция':
      case 'скидка':
        return <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${chatBurgerStyles.discountBadge}`}>💰 Скидка</span>;
      default:
        return <span className="px-2 py-1 text-xs font-bold bg-gray-200 text-gray-800 rounded-full">{tagName}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Шапка как в ChatBurger */}
      <header className={`${chatBurgerStyles.headerGradient} text-white sticky top-0 z-50 shadow-lg`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">ChatBurger</h1>
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 bg-white/20 rounded-lg"
            >
              🛒
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Блок города и способа получения */}
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <span className="mr-2">📍</span>
              <span className="font-medium">Самара</span>
              <div className="ml-4 flex space-x-2">
                <button
                  className={`px-3 py-1 rounded-full text-sm ${orderType === 'delivery' ? 'bg-white text-orange-600' : 'bg-white/20'}`}
                  onClick={() => setOrderType('delivery')}
                >
                  Доставка
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm ${orderType === 'pickup' ? 'bg-white text-orange-600' : 'bg-white/20'}`}
                  onClick={() => setOrderType('pickup')}
                >
                  Самовывоз
                </button>
              </div>
            </div>
            <div className="text-sm opacity-90">
              {orderType === 'delivery' ? 'Самара, ул. Партизанская 88' : 'Выберите филиал для самовывоза'}
            </div>
          </div>

          {/* Промо-баннер */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">ПЕЛЕРОНИ УЖЕ ЗДЕСЬ</div>
                <div className="text-sm">Попробуйте новую пицку с пепперони</div>
              </div>
              <div className="text-3xl">🍕</div>
            </div>
          </div>
        </div>

        {/* Категории - появляются/скрываются при скролле */}
        <AnimatePresence>
          {showCategories && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-white/10 backdrop-blur-sm"
            >
              <div className="flex overflow-x-auto px-4 py-3 hide-scrollbar">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`px-4 py-2 rounded-full whitespace-nowrap mr-3 flex-shrink-0 ${
                      activeCategory === category.id
                        ? 'bg-white text-orange-600 font-bold'
                        : 'bg-white/20 text-white'
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Основной контент */}
      <main className="px-4">
        {/* Секции продуктов в стиле ChatBurger */}
        {Object.entries(groupedProducts).map(([sectionName, sectionProducts]) => (
          <div key={sectionName} className="mb-8">
            {/* Заголовок секции */}
            <div className={`${chatBurgerStyles.sectionBg} rounded-2xl p-4 mb-4 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{sectionName}</h2>
                  {sectionName === 'Новичка' && (
                    <div className="text-sm text-gray-600 mt-1">Скидка для новых клиентов</div>
                  )}
                  {sectionName === 'Хит' && (
                    <div className="text-sm text-gray-600 mt-1">Самые популярные позиции</div>
                  )}
                </div>
                {renderBadge(sectionName)}
              </div>
            </div>

            {/* Продукты в секции */}
            <div className="space-y-4">
              {sectionProducts.map(product => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                        <div className="flex items-start">
                          <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                          {product.tags.map(tag => (
                            <span key={tag.id} className="ml-2">
                              {renderBadge(tag.name)}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-600 mt-2">{product.description}</p>

                        {/* Информация о продукте */}
                        <div className="flex items-center mt-3 text-sm text-gray-500">
                          {product.weight && (
                            <span className="mr-4">⚖️ {product.weight}г</span>
                          )}
                          {product.calories && (
                            <span>🔥 {product.calories} ккал</span>
                          )}
                        </div>
                      </div>

                      {/* Цена и кнопка добавления */}
                      <div className="flex flex-col items-end">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${chatBurgerStyles.priceColor}`}>
                            {Number(product.price).toFixed(2)} ₽
                          </div>
                          {product.oldPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              {Number(product.oldPrice).toFixed(2)} ₽
                            </div>
                          )}
                        </div>

                        <button
                          className={`${chatBurgerStyles.addButton} text-white rounded-full w-12 h-12 flex items-center justify-center mt-3 shadow-lg hover:shadow-xl transition-shadow`}
                          onClick={() => handleAddToCart(product)}
                        >
                          <span className="text-xl">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Рейтинги, если есть (как в первом изображении) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-8">
          <h3 className="font-bold text-lg mb-3">Рейтинги</h3>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">4.8</div>
              <div className="text-sm text-gray-600">Качество</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">4.4</div>
              <div className="text-sm text-gray-600">Сервис</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">4.9</div>
              <div className="text-sm text-gray-600">Вкус</div>
            </div>
          </div>
        </div>
      </main>

      {/* Фиксированная панель корзины внизу */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-500 shadow-2xl">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Корзина</div>
              <div className="text-2xl font-bold text-orange-600">
                {Number(subtotal).toFixed(2)} ₽
              </div>
            </div>

            <button
              className={`${chatBurgerStyles.addButton} text-white px-8 py-3 rounded-xl font-bold flex items-center shadow-lg hover:shadow-xl transition-all`}
              onClick={() => navigate('/cart')}
              disabled={totalItems === 0}
            >
              <span className="mr-2">🛒</span>
              {totalItems === 0 ? 'Корзина пуста' : `Оформить (${totalItems})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBurgerMenu;