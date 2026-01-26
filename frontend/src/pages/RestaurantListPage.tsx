
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const RestaurantListPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        console.log('📱 Запрос списка ресторанов');
        const response = await apiClient.getRestaurants();

        if (response.success && response.data) {
          console.log('✅ Ответ от API:', response.data);
          // Проверяем, является ли ответ пагинированным (содержит поле results)
          if (response.data.results !== undefined) {
            setRestaurants(Array.isArray(response.data.results) ? response.data.results : []);
          } else {
            // Если нет поля results, проверяем, является ли сам response.data массивом
            setRestaurants(Array.isArray(response.data) ? response.data : []);
          }
        } else {
          console.error('❌ Ошибка ответа от API:', response.error);
          setError(response.error || 'Неизвестная ошибка');
        }
      } catch (err) {
        console.error('❌ Ошибка при получении ресторанов:', err);
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Загрузка ресторанов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-500 p-4">
        <div className="text-xl mb-2">⚠️</div>
        <h3 className="font-bold mb-2">Ошибка загрузки данных</h3>
        <p className="text-center mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Шапка */}
      <div className="sticky top-0 z-10 bg-white shadow-sm p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Рестораны</h1>
      </div>

      {/* Список ресторанов */}
      <div className="p-4">
        {restaurants.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="text-4xl mb-4">🍽️</div>
            <p className="text-gray-600 mb-2">Рестораны не найдены</p>
            <p className="text-sm text-gray-400">В системе пока нет доступных ресторанов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/menu/${restaurant.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                    {restaurant.logo_url ? (
                      <img
                        src={restaurant.logo_url}
                        alt={restaurant.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{restaurant.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{restaurant.description || 'Описание отсутствует'}</p>
                    <div className="mt-1 flex items-center text-xs text-gray-400">
                      {restaurant.is_active ? (
                        <span className="inline-flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                          Неактивен
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantListPage;