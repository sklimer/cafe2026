import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { Product, Category } from '../types';
import { apiClient } from '../api/client';
import { useQuery } from '@tanstack/react-query';

// Вспомогательная функция для безопасного доступа к тегам
const getProductTags = (product: any): any[] => {
  if (!product) return [];
  if (Array.isArray(product.tags)) return product.tags;
  if (product.tags && typeof product.tags === 'object') {
    return Object.values(product.tags);
  }
  return [];
};

// Функция для рендеринга бейджей
const renderBadge = (tag: any, index: number) => {
  if (!tag || !tag.name) return null;

  const tagName = tag.name.toLowerCase();

  // Определение цветов для бейджей
  const getBadgeStyle = (tag: string) => {
    switch(tag) {
      case 'острый':
        return 'bg-[#ffcac4] text-black';
      case 'хит':
        return 'bg-[#886eee] text-white';
      case 'новинка':
        return 'bg-[#4bb14b] text-white';
      case 'скидка':
        return 'bg-[#eda735] text-white';
      case 'от шефа':
        return 'bg-[#313731] text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div
      key={index}
      className={`item-badge px-2 py-1 text-xs font-bold rounded-full mr-1 mb-1 ${getBadgeStyle(tagName)}`}
    >
      {tagName === 'острый' ? '🌶️ Острый' : tag.name}
    </div>
  );
};

const ChatBurgerMenu: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, subtotal, items } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showCategories, setShowCategories] = useState(true);

  // Загрузка данных
  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu'],
    queryFn: () => apiClient.getCategories().then(res => {
      console.log('API Response:', res);
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

  // Установка активной категории
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      const firstCategory = categories[0];
      setActiveCategory(firstCategory.id.toString());
    }
  }, [categories]);

  // Фильтрация продуктов по категории
  const productsByCategory = activeCategory
    ? products.filter(product => {
        const productCategoryId = product.categoryId || product.category;
        return productCategoryId?.toString() === activeCategory;
      })
    : products;

  // Группировка продуктов по категориям для отображения всех категорий сразу
  const productsByCategories = categories.reduce((acc, category) => {
    const categoryProducts = products.filter(product => {
      const productCategoryId = product.categoryId || product.category;
      return productCategoryId?.toString() === category.id.toString();
    });

    if (categoryProducts.length > 0) {
      acc.push({
        ...category,
        products: categoryProducts
      });
    }

    return acc;
  }, [] as Array<Category & { products: Product[] }>);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!menuData?.success) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-white">
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
    <div className="min-h-screen bg-white pb-20">
      {/* Верхняя панель навигации */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2">
              <div className="icon-18-menu-burger">
                <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
                  <path d="M17.2174 6.21729H0.782596C0.350376 6.21729 0 6.56766 0 6.99988C0 7.4321 0.350376 7.78248 17.2174 7.78248C17.6496 7.78248 18 7.4321 18 6.99988C18 6.56766 17.6496 6.21729 17.2174 6.21729Z"></path>
                  <path d="M0.782596 2.30445H17.2174C17.6496 2.30445 18 1.95407 18 1.52185C18 1.08963 17.6496 0.739258 17.2174 0.739258H0.782596C0.350376 0.739258 0 1.08963 0 1.52185C0 1.95407 0.350376 2.30445 0.782596 2.30445Z"></path>
                  <path d="M17.2174 11.6958H0.782596C0.350376 11.6958 0 12.0462 0 12.4784C0 12.9107 0.350376 13.261 0.782596 13.261H17.2174C17.6496 13.261 18 12.9107 18 12.4784C18 12.0462 17.6496 11.6958 17.2174 11.6958Z"></path>
                </svg>
              </div>
            </button>

            <div className="city flex-1 mx-4">
              <div className="name-city">
                <div className="font-medium">Самара</div>
              </div>
            </div>

            <button className="p-2">
              <div className="icons-18-search">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15.708 14.2968L12.611 11.1987C14.9283 8.10223 14.2965 3.71356 11.1997 1.39641C8.10291 -0.920736 3.71387 -0.288925 1.39653 2.80759C-0.920813 5.90411 -0.28895 10.2928 2.80783 12.6099C5.29542 14.4713 8.71207 14.4713 11.1997 12.6099L14.298 15.708C14.6874 16.0973 15.3187 16.0973 15.708 15.708C16.0973 15.3187 16.0973 14.6875 15.708 14.2982L15.708 14.2968ZM7.02958 12.012C4.27731 12.012 2.04618 9.78103 2.04618 7.02899C2.04618 4.27695 4.27731 2.04601 7.02958 2.04601C9.78185 2.04601 12.013 4.27695 12.013 7.02899C12.01 9.77978 9.78063 12.009 7.02958 12.012Z"></path>
                </svg>
              </div>
            </button>
          </div>

          {/* Выбор типа доставки */}
          <div className="select-type-delivery mb-4">
            <div className="row">
              <div className="select-content bg-gray-100 rounded-full p-1 inline-flex">
                <div className={`item px-4 py-2 rounded-full ${orderType === 'delivery' ? 'bg-white text-gray-900' : 'text-gray-600'}`}>
                  <div className="text" onClick={() => setOrderType('delivery')}>
                    <div className="text-sm font-medium">Доставка</div>
                  </div>
                </div>
                <div className={`item px-4 py-2 rounded-full ${orderType === 'pickup' ? 'bg-white text-gray-900' : 'text-gray-600'}`}>
                  <div className="text" onClick={() => setOrderType('pickup')}>
                    <div className="text-sm font-medium">Самовывоз</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Адрес */}
          <div className="select-address mb-4">
            <div className="menu-content-item flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 16 18" fill="currentColor" className="mr-2">
                <path d="M15.125 7.5C15.0915 8.92533 14.7368 10.3247 14.0876 11.5941C13.4383 12.8634 12.5111 13.9699 11.375 14.8312V17.25C11.375 17.4489 11.296 17.6397 11.1553 17.7803C11.0147 17.921 10.8239 18 10.625 18C10.4261 18 10.2353 17.921 10.0947 17.7803C9.95402 17.6397 9.875 17.4489 9.875 17.25V1.5C9.86827 1.2182 9.94528 0.94073 10.0963 0.702697C10.2473 0.464663 10.4655 0.276758 10.7233 0.16275C11.0194 0.0422739 11.3442 0.0106726 11.658 0.0718081C11.9718 0.132944 12.261 0.284168 12.4902 0.507C14.2298 2.41572 15.1725 4.91797 15.125 7.5ZM6.875 0C6.67609 0 6.48532 0.0790176 6.34467 0.21967C6.20402 0.360322 6.125 0.551088 6.125 0.75V5.25C6.12308 5.7137 5.97794 6.16547 5.70943 6.54352C5.44093 6.92158 5.06218 7.20744 4.625 7.362V0.75C4.625 0.551088 4.54598 0.360322 4.40533 0.21967C4.26468 0.0790176 4.07391 0 3.875 0C3.67609 0 3.48532 0.0790176 3.34467 0.21967C3.20402 0.360322 3.125 0.551088 3.125 0.75V7.362C2.68782 7.20744 2.30907 6.92158 2.04057 6.54352C1.77206 6.16547 1.62692 5.7137 1.625 5.25V0.75C1.625 0.551088 1.54598 0.360322 1.40533 0.21967C1.26468 0.0790176 1.07391 0 0.875 0C0.676088 0 0.485322 0.0790176 0.34467 0.21967C0.204018 0.360322 0.125 0.551088 0.125 0.75V5.25C0.126091 6.11415 0.425068 6.95151 0.971539 7.62094C1.51801 8.29036 2.27856 8.75093 3.125 8.925V17.25C3.125 17.4489 3.20402 17.6397 3.34467 17.7803C3.48532 17.921 3.67609 18 3.875 18C4.07391 18 4.26468 17.921 4.40533 17.7803C4.54598 17.6397 4.625 17.4489 4.625 17.25V8.925C5.47144 8.75093 6.23199 8.29036 6.77846 7.62094C7.32493 6.95151 7.62391 6.11415 7.625 5.25V0.75C7.625 0.551088 7.54598 0.360322 7.40533 0.21967C7.26468 0.0790176 7.07391 0 6.875 0Z"></path>
              </svg>
              <div className="text3 flex items-center justify-between flex-1">
                <div className="_88-7 text-sm">Самара, ул. Партизанская 88</div>
                <div className="icons-16-angle-right ml-2">
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="currentColor">
                    <path d="M4.72934 6.60887C4.80967 6.52919 4.87344 6.4344 4.91695 6.32995C4.96046 6.22551 4.98286 6.11348 4.98286 6.00033C4.98286 5.88719 4.96046 5.77516 4.91695 5.67071C4.87344 5.56627 4.80967 5.47147 4.72934 5.3918L0.79528 1.46631C0.714946 1.38663 0.651182 1.29184 0.607669 1.18739C0.564155 1.08295 0.541753 0.970919 0.541753 0.857773C0.541753 0.744626 0.564155 0.632599 0.607669 0.528154C0.651182 0.42371 0.714946 0.328914 0.79528 0.249236C0.955867 0.0896018 1.1731 0 1.39953 0C1.62596 0 1.84319 0.0896018 2.00378 0.249236L5.93784 4.18329C6.41936 4.66541 6.68982 5.31894 6.68982 6.00033C6.68982 6.68172 6.41936 7.33525 5.93784 7.81737L2.00378 11.7514C1.84414 11.9098 1.62867 11.999 1.40382 12C1.29102 12.0006 1.1792 11.979 1.07477 11.9364C0.970345 11.8937 0.875367 11.8309 0.79528 11.7514C0.714946 11.6717 0.651182 11.577 0.607669 11.4725C0.564155 11.3681 0.541753 11.256 0.541753 11.1429C0.541753 11.0297 0.564155 10.9177 0.607669 10.8133C0.651182 10.7088 0.714946 10.614 0.79528 10.5344L4.72934 6.60887Z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Свайпер для акций */}
          <div className="swiper-stocks mb-4">
            <div className="stocks flex overflow-x-auto">
              {[1, 2, 3, 4].map((_, index) => (
                <div key={index} className="section-img flex-shrink-0 w-20 h-20 mr-2 rounded-lg overflow-hidden">
                  <div className="img w-full h-full bg-gray-200"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Категории */}
        <AnimatePresence>
          {showCategories && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-gray-50 py-2 px-4 border-t border-gray-100"
            >
              <div className="category-swiper">
                <div className="swiper-tabs">
                  <div className="tabs flex overflow-x-auto">
                    {categories.map(category => (
                      <div
                        key={category.id}
                        className={`tab-item flex-shrink-0 px-4 py-2 rounded-full mr-2 ${
                          activeCategory === category.id.toString()
                            ? 'bg-white text-gray-900 font-medium shadow-sm'
                            : 'text-gray-600'
                        }`}
                        onClick={() => setActiveCategory(category.id.toString())}
                      >
                        <span>{category.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Основной контент */}
      <main className="px-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🍔</div>
            <h2 className="text-xl font-bold mb-2">Меню пусто</h2>
            <p className="text-gray-600 text-center">В данный момент нет доступных блюд</p>
          </div>
        ) : (
          <div className="space-y-6">
            {productsByCategories.map(categorySection => (
              <div key={categorySection.id} id={`category-${categorySection.id}`}>
                {/* Заголовок категории */}
                <div className="header-cat mb-4">
                  <div className="header-cat--name text-lg font-bold text-gray-900">
                    {categorySection.name}
                  </div>
                  {categorySection.description && (
                    <div className="header-cat--description text-gray-600 text-sm">
                      {categorySection.description}
                    </div>
                  )}
                </div>

                {/* Продукты категории */}
                <div className="row-product grid grid-cols-2 gap-3">
                  {categorySection.products.map(product => (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="item-product bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      {/* Изображение продукта */}
                      <div
                        className="img3 h-40 bg-gray-200 relative"
                        style={{
                          background: product.image
                            ? `url(${product.image}) center center / cover no-repeat`
                            : 'center center / cover no-repeat'
                        }}
                      >
                        <div className="functions absolute top-2 left-2 right-2 flex justify-between">
                          <div className="left">
                            <div className="rating flex items-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                              <div className="icons-12-rating mr-1">
                                <span className="text-yellow-400">⭐</span>
                              </div>
                              <div className="count">
                                <div className="text-xs font-medium">4.8</div>
                              </div>
                            </div>
                          </div>
                          <div className="right">
                            {/* Здесь могут быть другие функции */}
                          </div>
                        </div>
                      </div>

                      {/* Контент продукта */}
                      <div className="content p-3">
                        <div className="content-item-product">
                          {/* Бейджи */}
                          <div className="badges flex flex-wrap mb-2">
                            {getProductTags(product).map((tag, index) =>
                              renderBadge(tag, index)
                            )}
                          </div>

                          {/* Название и описание */}
                          <div className="text5">
                            <div className="font-bold text-gray-900 mb-1 line-clamp-1">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-2 min-h-[2.5rem]">
                              {product.description}
                            </div>
                          </div>
                        </div>

                        {/* Цена и кнопка */}
                        <div className="bottom mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="button-small">
                              <div className="price font-bold text-gray-900">
                                {Number(product.price).toFixed(2)} ₽
                              </div>
                            </div>
                            {product.old_price && (
                              <div className="old-price">
                                <div className="old text-xs text-gray-500 line-through">
                                  {Number(product.old_price).toFixed(2)} ₽
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            className="bg-orange-500 hover:bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                            onClick={() => handleAddToCart(product)}
                          >
                            <span className="text-lg">+</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Фиксированная панель корзины */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Корзина</div>
              <div className="text-xl font-bold text-gray-900">
                {Number(subtotal).toFixed(2)} ₽
              </div>
            </div>

            <button
              className={`bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center ${
                totalItems === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
              }`}
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