import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { useCartStore } from '../stores/cartStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { Branch } from '../types';
import { apiClient } from '../api/client';

interface ApiRestaurant {
  id: string;
  name: string;
  description: string;
  contact_phone: string;
  address: string;
  is_active?: boolean;
}

const RestaurantSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { subtotal } = useCartStore();
  const {
    selectedBranch,
    setSelectedBranch,
    loadDeliveryPreferences,
    setDeliveryType
  } = useDeliveryStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [loadingBranchId, setLoadingBranchId] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveryPreferences();
    loadRestaurants();
  }, [loadDeliveryPreferences]);

  const loadRestaurants = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getRestaurants();

      if (response.success && response.data) {
        let restaurantsData: ApiRestaurant[] = [];

        if (Array.isArray(response.data)) {
          restaurantsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          restaurantsData = response.data.results;
        } else if (typeof response.data === 'object') {
          restaurantsData = [response.data];
        }

        setRestaurants(restaurantsData);
      } else {
        setError(response.error || 'Не удалось загрузить список ресторанов');
      }
    } catch (err) {
      setError('Произошла ошибка при загрузке ресторанов');
      console.error('Error loading restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const backButton = tg.BackButton;
      if (backButton) {
        backButton.show();
        const handleClick = () => {
          handleBack();
        };
        backButton.onClick(handleClick);

        return () => {
          backButton.offClick(handleClick);
          backButton.hide();
        };
      }
    }
  }, [handleBack]);

  const handleRestaurantSelect = async (restaurant: ApiRestaurant) => {
    try {
      setLoadingBranchId(restaurant.id);
      setError(null);

      // Создаем branch объект
      const branch: Branch = {
        id: parseInt(restaurant.id),
        name: restaurant.name,
        address: restaurant.address,
        city: '',
        phone: restaurant.contact_phone || '',
        workTime: 'Ежедневно 10:00 - 23:00',
        restaurant: {
          id: parseInt(restaurant.id),
          name: restaurant.name
        },
        description: restaurant.description,
        is_accepting_orders: true,
        is_active: restaurant.is_active ?? true,
        delivery_fee: 0,
        free_delivery_threshold: 1000,
        min_order_amount: 0
      };

      // Сохраняем в локальном хранилище
      setSelectedBranch(branch);

      // Устанавливаем тип доставки на самовывоз
      setDeliveryType('pickup');

      // Сохраняем на сервере через обновление профиля пользователя
      const updateResponse = await apiClient.updateUser({
        delivery_type: 'pickup',
        selected_restaurant_for_pickup: parseInt(restaurant.id)
      });

      if (!updateResponse.success) {
        console.error('Ошибка сохранения на сервере:', updateResponse.error);
        setError('Не удалось сохранить выбор на сервере, но он сохранен локально');
        // Даем пользователю увидеть сообщение перед переходом
        setTimeout(() => navigate(-1), 1500);
        return;
      }

      // Возвращаемся на предыдущую страницу
      navigate(-1);
    } catch (err) {
      setError('Произошла ошибка при выборе ресторана');
      console.error('Error selecting restaurant:', err);
    } finally {
      setLoadingBranchId(null);
    }
  };

  return (
    <div className="min-vh-100 bg-white">
      <Container className="px-3 py-4">
        <div className="text-center mb-4">
          <h1 className="h3 fw-bold mb-2">ВЫБЕРИТЕ РЕСТОРАН</h1>
          <p className="text-muted">Выберите ресторан для самовывоза</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <div className="mb-4">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Загрузка ресторанов...</p>
            </div>
          ) : restaurants.length > 0 ? (
            restaurants.map((restaurant) => {
              const isSelected = selectedBranch?.restaurant?.id === parseInt(restaurant.id);
              const isActive = restaurant.is_active ?? true;

              return (
                <div
                  key={restaurant.id}
                  className={`card border mb-3 position-relative ${isSelected ? 'border-primary shadow-sm' : ''}`}
                  style={{
                    cursor: isActive ? 'pointer' : 'not-allowed',
                    borderWidth: isSelected ? '2px' : '1px',
                    transition: 'all 0.2s ease',
                    opacity: isActive ? 1 : 0.7
                  }}
                  onClick={() => isActive && !loadingBranchId && handleRestaurantSelect(restaurant)}
                >
                  {isSelected && (
                    <div className="position-absolute top-0 end-0 m-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  )}

                  <div className="card-body">
                    {loadingBranchId === restaurant.id && (
                      <div className="position-absolute top-0 end-0 p-2">
                        <Spinner animation="border" size="sm" variant="primary" />
                      </div>
                    )}

                    <div className="flex-grow-1">
                      {restaurant.address && (
                        <p className="text-muted small mb-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-muted me-1" style={{ opacity: 0.7 }}>
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          {restaurant.address}
                        </p>
                      )}

                      {restaurant.contact_phone && (
                        <p className="text-muted small mb-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-muted me-1" style={{ opacity: 0.7 }}>
                            <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.5-5.2-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/>
                          </svg>
                          {restaurant.contact_phone}
                        </p>
                      )}
                    </div>

                    {!isActive && (
                      <div className="mt-2 text-danger small">
                        В данный момент недоступен
                      </div>
                    )}

                    {isActive && isSelected && (
                      <div className="mt-2 text-success small">
                        ✓ Выбран для самовывоза
                      </div>
                    )}

                    {isActive && !isSelected && (
                      <div className="mt-2 text-primary small">
                        Нажмите для выбора
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-5">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-muted mb-3">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <p className="text-muted mb-4">Нет доступных ресторанов</p>
              <button
                className="btn btn-outline-primary"
                onClick={loadRestaurants}
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default RestaurantSelectionPage;