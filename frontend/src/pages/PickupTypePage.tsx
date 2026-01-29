
import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Badge } from 'react-bootstrap';
import { useCartStore } from '../stores/cartStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { Branch } from '../types';

const PickupTypePage: React.FC = () => {
  const navigate = useNavigate();
  const { subtotal } = useCartStore();
  const { selectedBranch, setSelectedBranch, loadDeliveryPreferences } = useDeliveryStore();

  useEffect(() => {
    // Загружаем сохраненные настройки доставки
    loadDeliveryPreferences();
  }, [loadDeliveryPreferences]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Управление кнопкой "Назад" в Telegram WebApp
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

  const handleRestaurantSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    navigate(-1); // возвращаемся на предыдущую страницу
  };

  return (
    <div className="min-vh-100 bg-white">
      {/* Основной контент */}
      <Container className="px-3 py-4">
        {/* Заголовок */}
        <div className="text-center mb-4">
          <h1 className="h3 fw-bold mb-2">
            <span className="text-muted">Доставка</span>
            {' | '}
            <span className="text-primary">Самовывоз</span>
          </h1>
          <p className="text-muted">Выберите точку продаж</p>
        </div>

        {/* Информация о выбранном ресторане или кнопка выбора */}
        <div className="mb-5">
          {selectedBranch ? (
            <div className="card border border-success mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h3 className="h6 fw-bold mb-0">{selectedBranch.name}</h3>
                  <Badge bg="success">Выбрано</Badge>
                </div>
                <p className="text-dark mb-1">{selectedBranch.address}</p>
                <p className="text-muted small mb-0">{selectedBranch.phone}</p>
                <p className="text-muted small mb-0">{selectedBranch.workTime}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted mb-4">Вы не выбрали ресторан для самовывоза</p>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary btn-lg py-3 fw-bold"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px'
                }}
                onClick={() => navigate('/select-restaurant')}
              >
                Выбрать ресторан
              </motion.button>
            </div>
          )}
        </div>

        {/* Кнопка выбора */}
        {selectedBranch && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary w-100 py-3 fw-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            onClick={() => navigate(-1)}
          >
            ВЫБРАТЬ
          </motion.button>
        )}

        {/* Корзина внизу */}
        <div className="text-center mt-5 pt-5">
          <div className="text-muted">Корзина {Number(subtotal).toFixed(0)} ₽</div>
        </div>
      </Container>
    </div>
  );
};

export default PickupTypePage;