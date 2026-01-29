import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from 'react-bootstrap';
import { useCartStore } from '../stores/cartStore';

const PickupTypePage: React.FC = () => {
  const navigate = useNavigate();
  const { subtotal } = useCartStore();

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

  const features = [
    { id: 1, text: 'ПЕПЕРОНИ УЖЕ ЗДЕСЬ', handle: '@CHATFOODRU' },
    { id: 2, text: 'ПОДПИШИТЕСЬ НА НАС', handle: '@CHATFOODRU' },
    { id: 3, text: 'ОСТАВЬТЕ ОТЗЫВ', rating: '4.9', maps: 'Яндекс Карты' }
  ];

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

        {/* Список фич */}
        <div className="mb-5">
          {features.map(feature => (
            <div key={feature.id} className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{feature.text}</div>
                    {feature.handle && (
                      <small className="text-primary">{feature.handle}</small>
                    )}
                  </div>
                  <div className="text-end">
                    {feature.rating && (
                      <div className="text-warning fw-bold">★{feature.rating}</div>
                    )}
                    {feature.maps && (
                      <small className="text-muted">{feature.maps}</small>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Кнопка выбора */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary w-100 py-3 fw-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px'
          }}
          onClick={() => navigate('/select-restaurant')}
        >
          ВЫБРАТЬ
        </motion.button>

        {/* Корзина внизу */}
        <div className="text-center mt-5 pt-5">
          <div className="text-muted">Корзина {Number(subtotal).toFixed(0)} ₽</div>
        </div>
      </Container>
    </div>
  );
};

export default PickupTypePage;