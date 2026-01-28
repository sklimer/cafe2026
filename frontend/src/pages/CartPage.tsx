import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { getFullImageUrl } from '../api/client';

// Компонент для изображения товара в корзине
const CartProductImage: React.FC<{
  src: string | null;
  alt: string;
  product: any;
}> = ({ src, alt, product }) => {
  const [hasError, setHasError] = useState(false);

  // Получаем URL изображения
  const getImageUrl = () => {
    if (src) return src;
    if (product?.main_image_url) return getFullImageUrl(product.main_image_url);
    if (product?.image_urls && product.image_urls.length > 0) {
      return getFullImageUrl(product.image_urls[0]);
    }
    return null;
  };

  const imageUrl = getImageUrl();

  if (!imageUrl || hasError) {
    return (
      <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light rounded">
        <span className="text-muted">🍔</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-100 h-100 object-fit-cover rounded"
      onError={() => setHasError(true)}
      style={{ borderRadius: '8px' }}
    />
  );
};

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, totalItems, clearCart, removeItem, updateQuantity } = useCartStore();
  const [isTelegramReady, setIsTelegramReady] = useState(false);

  const handleCheckout = () => {
    if (items.length > 0) {
      navigate('/checkout');
    }
  };

  const handleBack = useCallback(() => {
    console.log('handleBack called');
    navigate(-1);
  }, [navigate]);

  // Используем кнопку "Назад" Telegram Mini Apps
  useTelegramBackButton(handleBack, true);

  // Проверяем, доступен ли Telegram WebApp
  const isTelegramWebApp = !!window.Telegram?.WebApp;
  const platform = window.Telegram?.WebApp?.platform || 'unknown';
  const isMobile = ['android', 'ios'].includes(platform);

  // Показать свою кнопку "Назад" только если Telegram WebApp недоступен
  const showCustomBackButton = !isTelegramWebApp || !isMobile;

  // Для отладки
  useEffect(() => {
    console.log('CartPage mounted');
    console.log('isTelegramWebApp:', isTelegramWebApp);
    console.log('platform:', platform);
    console.log('isMobile:', isMobile);
    console.log('showCustomBackButton:', showCustomBackButton);

    if (isTelegramWebApp) {
      console.log('BackButton isVisible:', window.Telegram.WebApp.BackButton?.isVisible);
      console.log('WebApp version:', window.Telegram.WebApp.version);
      setIsTelegramReady(true);
    }
  }, [isTelegramWebApp, platform, isMobile, showCustomBackButton]);

  if (items.length === 0) {
    return (
      <div className="min-vh-100 bg-white pb-5">
        {/* Header */}
        <motion.header
          initial={{ y: 0 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky-top bg-white border-bottom"
        >
          <Container className="px-3 pt-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h1 className="h4 fw-bold text-dark mb-0">Корзина</h1>
              <div style={{ width: '60px' }}></div>
            </div>
          </Container>
        </motion.header>

        {/* Empty cart */}
        <Container className="px-3 pt-4">
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="display-1 mb-4 text-muted">🛒</div>
            <h2 className="h4 fw-bold text-dark mb-2">Ваша корзина пуста</h2>
            <p className="text-muted text-center mb-4">
              Добавьте товары в корзину, чтобы увидеть их здесь
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="btn w-100 py-3 rounded-3 shadow"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none'
              }}
            >
              Перейти к покупкам
            </motion.button>
          </div>
        </Container>

        {/* Fixed button for empty cart */}
        <div className="fixed-bottom px-3 py-2" style={{ height: '50px' }}>
          <button
            className="btn w-100 h-100 d-flex align-items-center justify-content-center rounded-3 shadow opacity-75"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none'
            }}
            disabled
          >
            <span>Корзина пуста</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-white pb-5">
      {/* Header */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky-top bg-white border-bottom"
      >
        <Container className="px-3 pt-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h1 className="h4 fw-bold text-dark mb-0">Корзина</h1>
            <div style={{ width: '60px' }}></div>
          </div>
        </Container>
      </motion.header>

      {/* Cart items */}
      <Container className="px-3 pt-4" style={{ paddingBottom: '120px' }}>
        <div className="mb-3">
          <h2 className="h5 fw-bold text-dark mb-3">Ваши товары</h2>

          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card border shadow-sm mb-3"
            >
              <div className="card-body p-3">
                {/* Карточка с изображением и информацией */}
                <div className="d-flex">
                  {/* Изображение товара */}
                  <div className="flex-shrink-0 me-3" style={{ width: '80px', height: '80px' }}>
                    <CartProductImage
                      src={null}
                      alt={item.product.name}
                      product={item.product}
                    />
                  </div>

                  {/* Информация о товаре */}
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '16px' }}>
                          {item.product.name}
                        </h3>
                        <p className="text-muted mb-2" style={{ fontSize: '12px' }}>
                          {item.product.description || 'Вкусный бургер от ChatBurger'}
                        </p>
                      </div>

                      <div className="text-end">
                        <div className="d-flex align-items-baseline justify-content-end mb-2">
                          <span className="h5 fw-bold text-dark mb-0">
                            {Number(item.price).toFixed(0)} ₽
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      {/* Quantity controls */}
                      <div className="d-flex align-items-center">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <span className="fw-bold">-</span>
                        </button>
                        <span className="mx-3 fw-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <span className="fw-bold">+</span>
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="btn btn-sm btn-link text-danger text-decoration-none p-0"
                      >
                        <i className="bi bi-trash me-1"></i>
                        Удалить
                      </button>
                    </div>

                    {/* Total for this item */}
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                      <span className="text-muted" style={{ fontSize: '14px' }}>
                        Итого за этот товар:
                      </span>
                      <span className="h5 fw-bold text-dark">
                        {(Number(item.price) * item.quantity).toFixed(0)} ₽
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Clear cart button */}
          <div className="mt-4">
            <button
              onClick={clearCart}
              className="btn btn-outline-danger w-100 py-3 rounded-3"
              style={{ fontSize: '16px', fontWeight: '600' }}
            >
              <i className="bi bi-trash me-2"></i>
              Очистить корзину
            </button>
          </div>
        </div>
      </Container>

      {/* Fixed bottom panel */}
      <div className="fixed-bottom bg-white border-top shadow-lg">
        <Container className="px-3 py-3">
          <div className="row align-items-center">
            <div className="col">
              <div className="small text-muted">Товаров: {getTotalItems()}</div>
              <div className="h4 fw-bold text-dark mb-0">
                {Number(subtotal).toFixed(0)} ₽
              </div>
            </div>
            <div className="col-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckout}
                className="btn px-4 py-3 rounded-3 shadow"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none'
                }}
              >
                Оформить заказ
              </motion.button>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default CartPage;