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

// Вспомогательная функция для безопасного доступа к тегам
const getProductTags = (product: any): any[] => {
  if (!product) return [];
  if (Array.isArray(product.tags)) return product.tags;
  if (product.tags && typeof product.tags === 'object') {
    // Если tags это объект, преобразуем в массив
    return Object.values(product.tags);
  }
  return [];
};

// Вспомогательная функция для получения первого тега
const getMainTag = (product: any): string => {
  const tags = getProductTags(product);
  if (tags.length > 0 && tags[0]?.name) {
    return tags[0].name;
  }
  return 'Другие';
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
    queryFn: () => apiClient.getCategories().then(res => {
      console.log('API Response:', res); // Для отладки
      return res;
    }),
    onError: (error) => {
      console.error('Error loading menu:', error);
    }
  });

  // Защита от undefined
  const categories = Array.isArray(menuData?.data?.categories)
    ? menuData.data.categories
    : [];

  const products = Array.isArray(menuData?.data?.products)
    ? menuData.data.products
    : [];

  console.log('Loaded categories:', categories.length);
  console.log('Loaded products:', products.length);
  console.log('Sample product:', products[0]); // Для отладки

  // Отладочная информация о структуре данных
  useEffect(() => {
    if (products.length > 0 && categories.length > 0) {
      console.log('Структура продукта:', Object.keys(products[0]));
      console.log('Структура категории:', Object.keys(categories[0]));
      console.log('ID категорий:', categories.map(c => ({ id: c.id, name: c.name })));
      console.log('Категории продуктов:', products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        categoryId: p.categoryId,
        category_name: p.category_name
      })));
    }
  }, [products, categories]);

  // Установка активной категории
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      // Устанавливаем первую категорию как активную
      const firstCategory = categories[0];
      console.log('Устанавливаем активную категорию:', firstCategory.id, firstCategory.name);
      setActiveCategory(firstCategory.id.toString());
    }
  }, [categories]);

  // ФИКС: Изменяем фильтрацию - используем product.category вместо product.categoryId
  const productsByCategory = activeCategory
    ? products.filter(product => {
        // Пробуем разные варианты полей категории
        const productCategoryId = product.categoryId || product.category;
        console.log('Фильтрация:', {
          productId: product.id,
          productName: product.name,
          productCategory: product.category,
          productCategoryId: product.categoryId,
          activeCategory,
          matches: productCategoryId?.toString() === activeCategory
        });
        return productCategoryId?.toString() === activeCategory;
      })
    : products; // Если нет активной категории, показываем все продукты

  // Группировка продуктов по тегам (для секций как в ChatBurger)
  const groupedProducts = productsByCategory.reduce((groups, product) => {
    const mainTag = getMainTag(product);

    if (!groups[mainTag]) {
      groups[mainTag] = [];
    }
    groups[mainTag].push(product);
    return groups;
  }, {} as Record<string, typeof products>);

  // Отладочный вывод группировки
  useEffect(() => {
    console.log('Активная категория:', activeCategory);
    console.log('Всего продуктов:', products.length);
    console.log('Продукты для этой категории:', productsByCategory.length);
    console.log('Продукты в активной категории:', productsByCategory.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      categoryId: p.categoryId
    })));
    console.log('Группировка:', Object.keys(groupedProducts).map(key => ({
      section: key,
      count: groupedProducts[key]?.length || 0
    })));
  }, [activeCategory, productsByCategory, groupedProducts]);

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
    if (!tagName || tagName === 'undefined') return null;

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

  // Если данных нет
  if (!menuData?.success) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-4xl mb-4">🍔</div>
        <h2 className="text-xl font-bold mb-2">Не удалось загрузить меню</h2>
        <p className="text-gray-600 text-center mb-4">
          {menuData?.error || 'Произошла ошибка при загрузке данных'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Скрытый блок для отладки */}
      <div className="hidden">
        <p>Активная категория: {activeCategory}</p>
        <p>Всего продуктов: {products.length}</p>
        <p>Продуктов в активной категории: {productsByCategory.length}</p>
        <p>Количество секций: {Object.keys(groupedProducts).length}</p>
        {Object.entries(groupedProducts).map(([name, prods]) => (
          <p key={name}>
            Секция "{name}": {prods.length} товаров
          </p>
        ))}
      </div>

      {/* Шапка как в ChatBurger */}
      <header className={`${chatBurgerStyles.headerGradient} text-white sticky top-0 z-50 shadow-lg`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">

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
                      activeCategory === category.id.toString()
                        ? 'bg-white text-orange-600 font-bold'
                        : 'bg-white/20 text-white'
                    }`}
                    onClick={() => {
                      console.log('Выбрана категория:', category.id, category.name);
                      setActiveCategory(category.id.toString());
                    }}
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
        {/* Проверка на пустые данные */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🍔</div>
            <h2 className="text-xl font-bold mb-2">Меню пусто</h2>
            <p className="text-gray-600 text-center">
              В данный момент нет доступных блюд
            </p>
          </div>
        ) : productsByCategory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🍔</div>
            <h2 className="text-xl font-bold mb-2">Нет товаров в этой категории</h2>
            <p className="text-gray-600 text-center">
              Выберите другую категорию
            </p>
            {/* Отладочная информация */}
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm">Отладка: Активная категория ID: {activeCategory}</p>
              <p className="text-sm">Всего продуктов: {products.length}</p>
              <p className="text-sm">Категории продуктов: {JSON.stringify(products.map(p => p.category))}</p>
            </div>
          </div>
        ) : (
          <>
            {/* ВРЕМЕННО: показываем все продукты без группировки для тестирования */}
            <div className="mb-8">
              <div className={`${chatBurgerStyles.sectionBg} rounded-2xl p-4 mb-4 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">
                    Все блюда ({productsByCategory.length})
                  </h2>
                  {renderBadge('Все')}
                </div>
              </div>

              <div className="space-y-4">
                {productsByCategory.map(product => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-4">
                          <div className="flex items-start flex-wrap">
                            <h3 className="font-bold text-lg text-gray-900 mr-2">{product.name}</h3>
                            {getProductTags(product).map((tag, index) => (
                              <span key={index} className="ml-2 mb-1">
                                {renderBadge(tag.name)}
                              </span>
                            ))}
                          </div>
                          <p className="text-gray-600 mt-2">{product.description}</p>

                          {/* Информация о продукте */}
                          <div className="flex items-center mt-3 text-sm text-gray-500">
                            {product.weight_grams && (
                              <span className="mr-4">⚖️ {product.weight_grams}г</span>
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
                            {product.old_price && (
                              <div className="text-sm text-gray-500 line-through">
                                {Number(product.old_price).toFixed(2)} ₽
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
          </>
        )}
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
              className={`${chatBurgerStyles.addButton} text-white px-8 py-3 rounded-xl font-bold flex items-center shadow-lg hover:shadow-xl transition-all ${totalItems === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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