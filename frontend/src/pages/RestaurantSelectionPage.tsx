import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from 'react-bootstrap';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { useCartStore } from '../stores/cartStore';

const RestaurantSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState('');
  const { subtotal, totalItems } = useCartStore();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Используем кнопку "Назад" Telegram Mini Apps
  useTelegramBackButton(handleBack, true);

  // Список ресторанов (можно вынести в API)
  const restaurants = [
    {
      id: 1,
      name: 'ChatBurger Партизанская',
      address: 'Самара, ул. Партизанская 88',
      fullAddress: 'Россия, Самара, Партизанская улица, 88',
      rating: 4.9,
      distance: '0.8 км'
    }
  ];

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
          <h1 className="h2 fw-bold text-dark mb-3">ВЫБЕРИТЕ АДРЕС</h1>
        </div>

        {/* Список ресторанов */}
        <div className="mb-4">
          {restaurants.map(restaurant => (
            <motion.div
              key={restaurant.id}
              whileTap={{ scale: 0.98 }}
              className={`card border mb-3 ${selectedAddress === restaurant.address ? 'border-primary' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedAddress(restaurant.address)}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h3 className="h6 fw-bold mb-0">{restaurant.name}</h3>
                  <div className="badge bg-warning text-dark">
                    ★ {restaurant.rating}
                  </div>
                </div>
                <p className="text-dark mb-1">{restaurant.address}</p>
                <p className="text-muted small mb-2">{restaurant.fullAddress}</p>
                <div className="d-flex align-items-center">
                  <span className="badge bg-light text-dark me-2">
                    {restaurant.distance}
                  </span>
                  <small className="text-muted">12-20 мин</small>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Кнопка выбора */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary w-100 py-3 fw-bold"
          disabled={!selectedAddress}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            opacity: selectedAddress ? 1 : 0.5
          }}
          onClick={() => {
            if (selectedAddress) {
              // Сохраняем выбор и возвращаемся назад
              localStorage.setItem('selectedRestaurant', selectedAddress);
              navigate(-1);
            }
          }}
        >
          Выбрать
        </motion.button>
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