import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from 'react-bootstrap';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { useCartStore } from '../stores/cartStore';

const AddressSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { subtotal, totalItems } = useCartStore();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Используем кнопку "Назад" Telegram Mini Apps
  useTelegramBackButton(handleBack, true);

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
        <div className="text-center mb-5">
          <h1 className="h2 fw-bold text-dark mb-3">ВЫБЕРИТЕ АДРЕС</h1>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary btn-lg w-100 py-3 fw-bold"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            onClick={() => navigate('/select-restaurant')}
          >
            + Добавить адрес
          </motion.button>
        </div>

        {/* Пример адреса (можно заменить динамическими данными) */}
        <div className="mt-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h3 className="h6 fw-bold mb-2">Адрес по умолчанию</h3>
              <p className="text-muted mb-0">
                Россия, Самара, Партизанская улица, 88
              </p>
            </div>
          </div>
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

export default AddressSelectionPage;