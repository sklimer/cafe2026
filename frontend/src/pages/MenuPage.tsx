import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { Product, Category } from '../types';

// Mock data - в реальной реализации будет получен через API
const mockProducts: Product[] = [
  {
    id: 'prod1',
    name: 'Пицца Маргарита',
    description: 'Итальянская классика с томатами и моцареллой',
    price: 450,
    image: '',
    weight: 500,
    calories: 850,
    proteins: 35,
    fats: 25,
    carbs: 95,
    categoryId: 'cat1',
    restaurantId: 'rest1',
    tags: [],
    options: [],
    isPopular: true,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod2',
    name: 'Бургер классический',
    description: 'Мясная котлета, свежие овощи, соус',
    price: 350,
    image: '',
    weight: 300,
    calories: 750,
    proteins: 40,
    fats: 30,
    carbs: 80,
    categoryId: 'cat2',
    restaurantId: 'rest1',
    tags: [],
    options: [],
    isPopular: false,
    isNew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod3',
    name: 'Картофель фри',
    description: 'Хрустящий картофель из свежего картофеля',
    price: 150,
    image: '',
    weight: 200,
    calories: 550,
    proteins: 5,
    fats: 25,
    carbs: 75,
    categoryId: 'cat3',
    restaurantId: 'rest1',
    tags: [],
    options: [],
    isPopular: true,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCategories: Category[] = [
  { id: 'cat1', name: 'Пицца', restaurantId: 'rest1', sortOrder: 1, isActive: true },
  { id: 'cat2', name: 'Бургеры', restaurantId: 'rest1', sortOrder: 2, isActive: true },
  { id: 'cat3', name: 'Закуски', restaurantId: 'rest1', sortOrder: 3, isActive: true },
  { id: 'cat4', name: 'Напитки', restaurantId: 'rest1', sortOrder: 4, isActive: true },
];

const MenuPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { addItem, totalItems, subtotal } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string>('cat1');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  
  // Фильтруем продукты по активной категории
  const productsByCategory = mockProducts.filter(
    product => product.categoryId === activeCategory
  );

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

  return (
    <div className="pb-20">
      {/* Шапка с названием ресторана и корзиной */}
      <div className="sticky top-0 z-10 bg-white shadow-sm p-4 flex items-center justify-between">
        <button className="text-gray-500 mr-2">
          ←
        </button>
        <h1 className="text-lg font-bold truncate flex-1 text-center">Ресторан "Пример"</h1>
        <div className="relative ml-2">
          <button className="text-xl">
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
          {mockCategories.map(category => (
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
          ))}
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
            {productsByCategory.map(product => (
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
            ))}
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
        <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 flex items-center">
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
                {selectedProduct.tags.length > 0 && (
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