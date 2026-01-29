
import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Badge } from 'react-bootstrap';
import { useCartStore } from '../stores/cartStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { Address } from '../types';

const DeliveryTypePage: React.FC = () => {
  const navigate = useNavigate();
  const { subtotal } = useCartStore();
  const { userAddresses, selectedAddress, setSelectedAddress, loadDeliveryPreferences } = useDeliveryStore();

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

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    navigate(-1); // возвращаемся на предыдущую страницу
  };

  return (
    <div className="min-vh-100 bg-white">
      {/* Основной контент */}
      <Container className="px-3 py-4">
        {/* Заголовок */}
        <div className="text-center mb-4">
          <h1 className="h3 fw-bold mb-2">
            <span className="text-primary">Доставка</span>
            {' | '}
            <span className="text-muted">Самовывоз</span>
          </h1>
          <p className="text-muted">Выберите адрес доставки</p>
        </div>

        {/* Список адресов */}
        <div className="mb-5">
          {userAddresses.length > 0 ? (
            userAddresses.map((address) => (
              <div
                key={address.id}
                className={`card border mb-3 ${selectedAddress?.id === address.id ? 'border-primary' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleAddressSelect(address)}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h3 className="h6 fw-bold mb-0">{address.alias || 'Адрес'}</h3>
                    {address.is_default && (
                      <Badge bg="primary" className="align-self-start">Основной</Badge>
                    )}
                  </div>
                  <p className="text-dark mb-1">{address.street}, {address.house}</p>
                  {address.apartment && (
                    <p className="text-muted mb-0">Квартира: {address.apartment}</p>
                  )}
                  {address.comment && (
                    <p className="text-muted small mb-0">Комментарий: {address.comment}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5">
              <p className="text-muted mb-4">У вас пока нет сохраненных адресов</p>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary btn-lg py-3 fw-bold"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px'
                }}
                onClick={() => navigate('/select-address')}
              >
                + Добавить адрес
              </motion.button>
            </div>
          )}
        </div>

        {/* Кнопка выбора */}
        {userAddresses.length > 0 && (
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

export default DeliveryTypePage;