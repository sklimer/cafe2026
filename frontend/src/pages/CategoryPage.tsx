import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { Product } from '../types';

// Mock data
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
    tags: [
      { id: 'tag1', name: 'Хит', color: '#FFD700', icon: '⭐', isActive: true },
      { id: 'tag2', name: 'Вегетарианская', color: '#32CD32', icon: '🍅', isActive: true }
    ],
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
    oldPrice: 400,
    image: '',
    weight: 300,
    calories: 750,
    proteins: 40,
    fats: 30,
    carbs: 80,
    categoryId: 'cat1',
    restaurantId: 'rest1',
    tags: [
      { id: 'tag3', name: 'Новинка', color: '#FF6347', icon: '🆕', isActive: true }
    ],
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
    categoryId: 'cat1',
    restaurantId: 'rest1',
    tags: [],
    options: [],
    isPopular: true,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { addItem, itemCount } = useCartStore();
  const [sortBy, setSortBy] = useState<'popularity' | 'price_asc' | 'price_desc'>('popularity');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Фильтруем и сортируем продукты
  let filteredProducts = [...mockProducts];
  
  // Фильтрация по тегам
  if (filterTag) {
    filteredProducts = filteredProducts.filter(product => 
      product.tags.some(tag => tag.name.toLowerCase().includes(filterTag.toLowerCase()))
    );
  }
  
  // Сортировка
  filteredProducts.sort((a, b) => {
    if (sortBy === 'popularity') {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return 0;
    } else if (sortBy === 'price_asc') {
      return a.price - b.price;
    } else if (sortBy === 'price_desc') {
      return b.price - a.price;
    }
    return 0;
  });

  const handleAddToCart = (product: Product) => {
    addItem(product, 1, []);
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
        <h1 className="text-lg font-bold truncate flex-1 text-center">Категория</h1>
        <div className="ml-2 w-8"></div> {/* Для выравнивания */}
      </div>

      <div className="p-4">
        {/* Фильтры и сортировка */}
        <div className="mb-4">
          <div className="flex space-x-2 mb-3 overflow-x-auto hide-scrollbar">
            {['Все', 'Хиты', 'Новинки', 'Вегетарианское'].map(tag => (
              <button
                key={tag}
                className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${
                  filterTag === tag || (tag === 'Все' && !filterTag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => setFilterTag(tag === 'Все' ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="popularity">По популярности</option>
            <option value="price_asc">Сначала дешевые</option>
            <option value="price_desc">Сначала дорогие</option>
          </select>
        </div>

        {/* Список продуктов */}
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
              onClick={() => navigate(`/product/${product.id}`)}
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
                    {product.oldPrice && (
                      <div className="text-xs text-gray-500 line-through">
                        {product.oldPrice}₽
                      </div>
                    )}
                    <div className="font-bold text-gray-900">{product.price}₽</div>
                  </div>
                </div>

                <div className="mt-2 flex justify-between items-center">
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 2).map(tag => (
                      <span 
                        key={tag.id} 
                        className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded"
                      >
                        {tag.icon} {tag.name}
                      </span>
                    ))}
                    {product.tags.length > 2 && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded">
                        +{product.tags.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    +
                    {itemCount(product.id) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                        {itemCount(product.id)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;