
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { Product, SelectedOption } from '../types';
import { apiClient } from '../api/client';
import { useQuery } from '@tanstack/react-query';

const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [maxChoicesWarning, setMaxChoicesWarning] = useState<string | null>(null);

  // Загружаем данные продукта из API
  const {
    data: productData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => apiClient.getProduct(productId!).then(res => res.data),
    enabled: !!productId
  });

  const product = productData?.product;

  // Вычисляем итоговую цену с учетом опций
  let totalPrice = product?.price || 0;
  selectedOptions.forEach(option => {
    const optionDef = product?.options.find(opt => opt.id === option.optionId);
    if (optionDef) {
      const value = optionDef.values.find(val => val.id === option.valueId);
      if (value) {
        totalPrice += value.priceDelta;
      }
    }
  });
  totalPrice *= quantity;

  // Обработка выбора опции
  const handleOptionChange = (optionId: string, valueId: string, type: 'single' | 'multiple') => {
    setMaxChoicesWarning(null);

    if (type === 'single') {
      // Для одиночного выбора заменяем значение
      setSelectedOptions(prev => [
        ...prev.filter(opt => opt.optionId !== optionId),
        { optionId, valueId }
      ]);
    } else {
      // Для множественного выбора добавляем/удаляем
      const optionDef = product?.options.find(opt => opt.id === optionId);
      if (!optionDef || !optionDef.maxChoices) return;

      const currentSelections = selectedOptions.filter(opt => opt.optionId === optionId);
      const isSelected = currentSelections.some(opt => opt.valueId === valueId);

      if (isSelected) {
        // Удаляем выбранное значение
        setSelectedOptions(prev => prev.filter(opt => !(opt.optionId === optionId && opt.valueId === valueId)));
      } else {
        // Проверяем ограничение на количество
        if (currentSelections.length >= optionDef.maxChoices!) {
          setMaxChoicesWarning(`Можно выбрать до ${optionDef.maxChoices} вариантов`);
          setTimeout(() => setMaxChoicesWarning(null), 2000);
          return;
        }

        // Добавляем выбранное значение
        setSelectedOptions(prev => [
          ...prev,
          { optionId, valueId }
        ]);
      }
    }
  };

  // Проверяем, является ли опция выбранной
  const isOptionSelected = (optionId: string, valueId: string) => {
    return selectedOptions.some(opt => opt.optionId === optionId && opt.valueId === valueId);
  };

  // Добавление в корзину
  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity, selectedOptions);
      navigate(-1); // Возвращаемся назад
    }
  };

  // Показываем индикатор загрузки если данные еще не загружены
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Показываем ошибку если произошла ошибка загрузки
  if (error || !product) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        Ошибка загрузки данных: {(error as Error)?.message || 'Товар не найден'}
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
        <h1 className="text-lg font-bold truncate flex-1 text-center">Детали товара</h1>
        <div className="ml-2 w-8"></div> {/* Для выравнивания */}
      </div>

      {/* Изображение галереи */}
      <div className="bg-gray-200 h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-2">🍕</div>
          <p className="text-gray-600">Изображение товара</p>
        </div>
      </div>

      <div className="p-4">
        {/* Название и описание */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600 mt-1">{product.description}</p>
        </div>

        {/* Характеристики */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h2 className="font-medium mb-2">Характеристики:</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Вес: {product.weight}г</div>
            {product.calories && <div>• Калории: {product.calories} ккал</div>}
            {product.proteins && product.fats && product.carbs && (
              <div>• Белки: {product.proteins}г / Жиры: {product.fats}г / Угл: {product.carbs}г</div>
            )}
          </div>
        </div>

        {/* Теги */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {product.tags.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
              >
                {tag.icon} {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Опции */}
        <div className="space-y-4 mb-4">
          {product.options.map(option => (
            <div key={option.id}>
              <h3 className="font-medium mb-2">{option.name}{option.required && '*'}</h3>

              {option.type === 'single' ? (
                <div className="space-y-2">
                  {option.values.map(value => (
                    <label
                      key={value.id}
                      className={`flex items-center p-3 rounded-lg border ${
                        isOptionSelected(option.id, value.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={option.id}
                        checked={isOptionSelected(option.id, value.id)}
                        onChange={() => handleOptionChange(option.id, value.id, 'single')}
                        className="mr-3"
                      />
                      <span className="flex-1">{value.name}</span>
                      <span>{value.priceDelta > 0 ? `+${value.priceDelta}₽` : value.priceDelta < 0 ? `${value.priceDelta}₽` : ''}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 mb-1">
                    Можно выбрать до {option.maxChoices}
                  </div>
                  {option.values.map(value => (
                    <label
                      key={value.id}
                      className={`flex items-center p-3 rounded-lg border ${
                        isOptionSelected(option.id, value.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isOptionSelected(option.id, value.id)}
                        onChange={() => handleOptionChange(option.id, value.id, 'multiple')}
                        className="mr-3"
                      />
                      <span className="flex-1">{value.name}</span>
                      <span>{value.priceDelta > 0 ? `+${value.priceDelta}₽` : value.priceDelta < 0 ? `${value.priceDelta}₽` : ''}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Количество */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium">Количество:</span>
          <div className="flex items-center border rounded-lg">
            <button
              className="w-10 h-10 flex items-center justify-center"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
            >
              -
            </button>
            <span className="w-10 h-10 flex items-center justify-center border-l border-r">
              {quantity}
            </span>
            <button
              className="w-10 h-10 flex items-center justify-center"
              onClick={() => setQuantity(q => q + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Итого */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Итого:</span>
            <span className="text-lg font-bold">{totalPrice}₽</span>
          </div>
        </div>

        {/* Предупреждение о макс. выборе */}
        {maxChoicesWarning && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 text-center">
            {maxChoicesWarning}
          </div>
        )}

        {/* Кнопка добавить в корзину */}
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
          onClick={handleAddToCart}
        >
          Добавить в корзину за {totalPrice}₽
        </button>
      </div>
    </div>
  );
};

export default ProductPage;