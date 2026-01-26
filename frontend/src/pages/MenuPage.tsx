
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { Product, Category } from '../types';
import { apiClient } from '../api/client';
import { useQuery } from '@tanstack/react-query';

const MenuPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore(state => state.addItem);
  const totalItems = useCartStore(state => state.totalItems);
  const subtotal = useCartStore(state => state.subtotal);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Добавляем отладочную информацию
  useEffect(() => {
    console.log('🔍 Отладка MenuPage:');
    console.log('  restaurantId:', restaurantId);
    console.log('  window.Telegram:', window.Telegram);
    console.log('  window.Telegram?.WebApp?.initData:', window.Telegram?.WebApp?.initData);
    console.log('  initial totalItems:', totalItems);
    console.log('  initial subtotal:', subtotal);

    // Принудительный тестовый запрос
    if (restaurantId) {
      console.log('🔍 Выполнение тестового запроса...');
      apiClient.getCategories(restaurantId)
        .then(response => {
          console.log('✅ Тестовый ответ от getCategories:', response);
        })
        .catch(error => {
          console.error('❌ Тестовая ошибка getCategories:', error);
        });
    }
  }, [restaurantId]);

  // Отслеживаем изменения состояния корзины
  useEffect(() => {
    console.log('🛒 Состояние корзины обновлено:', { totalItems, subtotal });
  }, [totalItems, subtotal]);

  // Загружаем меню ресторана (категории и продукты) из API
  const {
    data: menuData,
    isLoading: menuLoading,
    error: menuError
  } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: async () => {
      console.log('📱 Запрос меню для ресторана:', restaurantId);

      const response = await apiClient.getCategories(restaurantId!);
      console.log('📱 Полный ответ API getCategories:', response);

      // В зависимости от структуры ответа
      if (response.success) {
        // Преобразуем продукты, чтобы убедиться, что у них правильное поле categoryId
        let transformedData = response.data;

        if (transformedData && transformedData.products) {
          transformedData = {
            ...transformedData,
            products: transformedData.products.map((product: any) => ({
              ...product,
              // Убедимся, что у продукта есть поле categoryId
              categoryId: product.categoryId || product.category || (product.category?.id || null),
              restaurantId: product.restaurantId || product.restaurant || (product.restaurant?.id || null)
            }))
          };
        }

        return transformedData;
      } else {
        // Если response это прямые данные
        console.log('⚠️ Ответ не содержит success: true', response);
        return response;
      }
    },
    enabled: !!restaurantId,
    retry: 2,
    retryDelay: 1000
  });

  // Добавляем логирование структуры данных
  useEffect(() => {
    if (!menuLoading && !menuError && menuData) {
      console.log('📊 Структура menuData:', {
        hasRestaurant: !!menuData.restaurant,
        restaurant: menuData.restaurant,
        hasCategories: Array.isArray(menuData.categories),
        categoriesCount: menuData.categories?.length || 0,
        hasProducts: Array.isArray(menuData.products),
        productsCount: menuData.products?.length || 0,
        keys: Object.keys(menuData),
        fullData: menuData
      });
    }
  }, [menuData, menuLoading, menuError]);

  // Извлекаем категории и продукты из ответа
  const categories = menuData?.categories || [];
  const products = menuData?.products || [];
  const restaurant = menuData?.restaurant;

  // Устанавливаем первую категорию как активную при загрузке
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Обновляем активную категорию после загрузки данных
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  console.log('📊 Парсинг данных:', {
    categoriesLength: categories.length,
    productsLength: products.length,
    restaurantName: restaurant?.name
  });

  // Дополнительные логи для отладки
  useEffect(() => {
    if (categories.length > 0 && products.length > 0) {
      console.log('📋 Информация о первой категории:', {
        id: categories[0].id,
        name: categories[0].name,
        restaurantId: categories[0].restaurantId
      });

      console.log('📋 Информация о первом продукте:', {
        id: products[0].id,
        name: products[0].name,
        categoryId: products[0].categoryId, // Теперь должно быть правильно
        restaurantId: products[0].restaurantId
      });

      console.log('📋 Активная категория:', activeCategory);

      // Проверяем, какие продукты подходят под активную категорию
      const filteredProducts = products.filter(
        product => product.categoryId === activeCategory
      );
      console.log('📋 Отфильтрованные продукты:', filteredProducts);
    }
  }, [categories, products, activeCategory]);

  // Функция для добавления товара в корзину
  const handleAddToCart = (product: Product) => {
    addItem(product, 1, []);
  };

  // Эффект для отслеживания скролла и изменения активной категории
  useEffect(() => {
    const handleScroll = () => {
      // В реальной реализации здесь будет логика определения активной категории при скролле
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Фильтруем продукты по активной категории
  const productsByCategory = products.filter(
    product => product.categoryId === activeCategory
  );

  // Показываем индикатор загрузки если данные еще не загружены
  if (menuLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Загрузка меню...</p>
        <p className="text-sm text-gray-400 mt-2">Ресторан ID: {restaurantId}</p>
      </div>
    );
  }

  // Показываем ошибку если произошла ошибка загрузки
  if (menuError) {
    console.error('❌ Ошибка в MenuPage:', menuError);
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-500 p-4">
        <div className="text-xl mb-2">⚠️</div>
        <h3 className="font-bold mb-2">Ошибка загрузки данных</h3>
        <p className="text-center mb-4">
          {(menuError as Error)?.message || 'Не удалось загрузить меню'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  // Проверка на пустые данные
  if (!menuData) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-4xl mb-4">🍽️</div>
        <p className="text-gray-600 mb-2">Меню пусто или не найдено</p>
        <p className="text-sm text-gray-400">Ресторан ID: {restaurantId}</p>
      </div>
    );
  }

  // УДАЛЕНО: Второе объявление handleAddToCart - оно уже есть выше

  return (
    <div className="pb-20">

      <div className="sticky top-0 z-10 bg-white shadow-sm p-4 flex items-center justify-between">
        <button className="text-gray-500 mr-2">
          ←
        </button>
        <h1 className="text-lg font-bold truncate flex-1 text-center">
          {restaurant?.name || menuData?.restaurant?.name || 'Ресторан'}
        </h1>
        <div className="relative ml-2">
          <button className="text-xl" onClick={() => navigate('/cart')}>
            🛒
          </button>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {totalItems}
            </span>
          )}
        </div>
      </div>

      {/* Навигация по категориям */}
      <div className="bg-white p-3 sticky top-[68px] z-10 overflow-x-auto hide-scrollbar">
        <div ref={categoriesRef} className="flex space-x-4 min-w-max">
          {categories.length > 0 ? (
            categories.map(category => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 italic">
              Нет категорий
            </div>
          )}
        </div>
      </div>

      {/* Список продуктов */}
      <div className="p-4">
        <AnimatePresence>
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {productsByCategory.length > 0 ? (
              productsByCategory.map(product => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{product.price}₽</div>
                        {product.oldPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            {product.oldPrice}₽
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex justify-between items-center">
                      {product.isNew && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          🆕 Новинка
                        </span>
                      )}
                      {product.isPopular && !product.isNew && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          ⭐ Хит
                        </span>
                      )}

                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-500">
                {categories.length > 0 ? 'Нет товаров в этой категории' : 'Нет товаров'}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Фиксированная строка корзины внизу */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-3 flex justify-between items-center">
        <div>
          <div className="text-sm font-medium">Корзина</div>
          <div className="text-xs text-gray-500">
            {totalItems} товар{totalItems % 10 === 1 && totalItems % 100 !== 11 ? '' : totalItems % 10 > 1 && totalItems % 10 < 5 && (totalItems % 100 < 10 || totalItems % 100 >= 20) ? 'а' : 'ов'} • {subtotal}₽
          </div>
        </div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 flex items-center" onClick={() => navigate('/checkout')}>
          🛒 Перейти к заказу
        </button>
      </div>

      {/* Модальное окно продукта */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500"
              >
                ←
              </button>
              <h2 className="text-lg font-bold flex-1 text-center">{selectedProduct.name}</h2>
              <div className="w-8"></div> {/* Для выравнивания */}
            </div>

            <div className="mb-6">
              <p className="text-gray-600">{selectedProduct.description}</p>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Характеристики:</h3>
                <div className="text-sm text-gray-600">
                  <div>• Вес: {selectedProduct.weight}г</div>
                  {selectedProduct.calories && <div>• Калории: {selectedProduct.calories} ккал</div>}
                  {selectedProduct.proteins && selectedProduct.fats && selectedProduct.carbs && (
                    <div>• Белки: {selectedProduct.proteins}г / Жиры: {selectedProduct.fats}г / Угл: {selectedProduct.carbs}г</div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedProduct.tags.map(tag => (
                      <span key={tag.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {tag.icon} {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  Добавить в корзину за {selectedProduct.price}₽
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;