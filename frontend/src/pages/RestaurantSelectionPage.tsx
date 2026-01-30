
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from 'react-bootstrap';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { useCartStore } from '../stores/cartStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { Branch } from '../types';
import { apiClient } from '../api/client';

const RestaurantSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { subtotal, totalItems } = useCartStore();
  const { selectedBranch, setSelectedBranch } = useDeliveryStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Используем кнопку "Назад" Telegram Mini Apps
  useTelegramBackButton(handleBack, true);

  // Загружаем список ресторанов/филиалов
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        // Пока используем фиктивные данные, но в будущем можно загружать из API
        // const response = await apiClient.getBranches('some_restaurant_id');
        // if (response.success && response.data) {
        //   setBranches(response.data as Branch[]);
        // } else {
        //   setError(response.error || 'Не удалось загрузить список ресторанов');
        // }

        // Временные фиктивные данные до интеграции с API
        const mockBranches: Branch[] = [
          {
            id: '1',
            restaurantId: '1',
            name: 'ChatBurger Партизанская',
            address: 'Самара, ул. Партизанская 88',
            phone: '+7 (846) 123-45-67',
            workTime: 'Ежедневно 10:00-22:00',
            coordinates: [53.195872, 50.100231],
            isDeliveryAvailable: true,
            deliveryRadius: 5,
            isActive: true
          },
          {
            id: '2',
            restaurantId: '1',
            name: 'ChatBurger Ленинская',
            address: 'Самара, ул. Ленинская 15',
            phone: '+7 (846) 123-45-68',
            workTime: 'Ежедневно 09:00-23:00',
            coordinates: [53.200123, 50.150456],
            isDeliveryAvailable: true,
            deliveryRadius: 5,
            isActive: true
          }
        ];
        setBranches(mockBranches);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке ресторанов');
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    navigate(-1); // возвращаемся на предыдущую страницу
  };

  return (
    <div className="min-vh-100 bg-white">
      {/* Шапка */}
      <div className="position-sticky top-0 bg-white border-bottom shadow-sm">
        <Container className="px-3 py-3">
          <div className="d-flex align-items-center justify-content-center">
            <div className="text-center w-100">
              <div className="h4 fw-bold mb-0">ChatBurger</div>
            </div>
          </div>
        </Container>
      </div>

      {/* Основной контент */}
      <Container className="px-3 py-4">
        <div className="text-center mb-4">
          <h1 className="h2 fw-bold text-dark mb-3">ВЫБЕРИТЕ РЕСТОРАН</h1>
        </div>

        {/* Список ресторанов */}
        <div className="mb-4">
          {loading ? (
            <div className="text-center py-5">
              <p>Загрузка ресторанов...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              {error}
              <br />
              <button
                className="btn btn-primary mt-2"
                onClick={() => window.location.reload()}
              >
                Повторить
              </button>
            </div>
          ) : branches.length > 0 ? (
            branches.map(branch => (
              <motion.div
                key={branch.id}
                whileTap={{ scale: 0.98 }}
                className={`card border mb-3 ${selectedBranch?.id === branch.id ? 'border-primary' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleBranchSelect(branch)}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h3 className="h6 fw-bold mb-0">{branch.name}</h3>
                    {selectedBranch?.id === branch.id && (
                      <span className="badge bg-success">Выбрано</span>
                    )}
                  </div>
                  <p className="text-dark mb-1">{branch.address}</p>
                  <p className="text-muted small mb-1">{branch.phone}</p>
                  <p className="text-muted small mb-0">{branch.workTime}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">Нет доступных ресторанов++</p>
            </div>
          )}
        </div>
      </Container>

      {/* Фиксированная кнопка корзины */}
      <div className="position-fixed bottom-0 start-0 end-0">
        <div className="h-100 w-100 px-3 py-2" style={{ backgroundColor: 'white', boxShadow: '0 -2px 20px rgba(0,0,0,0.1)' }}>
          <button
            className={`btn w-100 h-100 d-flex align-items-center justify-content-center rounded-3 shadow ${totalItems() === 0 ? 'opacity-75' : ''}`}
            onClick={() => totalItems() > 0 && navigate('/cart')}
            disabled={totalItems() === 0}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              fontSize: '18px',
              fontWeight: '700',
              border: 'none',
              minHeight: '56px'
            }}
          >
            <span className="d-flex align-items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Корзина {Number(subtotal).toFixed(0)} ₽
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSelectionPage;