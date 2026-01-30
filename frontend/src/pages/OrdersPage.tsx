import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Alert, Spinner, Form, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { useOrderStore } from '../stores/orderStore';
import { apiClient } from '../api/client';

const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const {
    selectedBranch,
    selectedAddress,
    userAddresses,
    deliveryType,
    setDeliveryType,
    loadDeliveryPreferences
  } = useDeliveryStore();
  const { createOrder, loading: orderLoading } = useOrderStore();

  // Состояния формы
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [promoCode, setPromoCode] = useState('');
  const [useBonus, setUseBonus] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [utensils, setUtensils] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Константы
  const userBonusBalance = 500.00;
  const maxBonusToUse = 45.00;
  const availableBonus = Math.min(maxBonusToUse, userBonusBalance, subtotal);

  // Загружаем данные пользователя
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await apiClient.getUserProfile();
        if (response.success && response.data) {
          setUserProfile(response.data);
          if (response.data.phone) {
            setPhone(response.data.phone);
          }
          // Устанавливаем тип доставки из профиля
          if (response.data.delivery_type) {
            setDeliveryType(response.data.delivery_type);
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserData();
    loadDeliveryPreferences();
  }, [loadDeliveryPreferences, setDeliveryType]);

  // Обработчик кнопки "Назад"
  const handleBack = useCallback(() => {
    navigate(-1);
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

  // Обработчик переключения вкладок
  const handleDeliveryTypeChange = async (type: 'delivery' | 'pickup') => {
    setDeliveryType(type);
    // Обновляем тип доставки на сервере
    try {
      await apiClient.updateUser({
        delivery_type: type
      });
    } catch (err) {
      console.error('Error updating delivery type:', err);
    }
  };

  // Находим адрес по умолчанию
  const defaultAddress = userAddresses.find(addr => addr.is_default);

  // Рассчет итоговой суммы
  const calculateTotal = () => {
    let total = subtotal;
    if (useBonus) {
      total = Math.max(0, total - bonusAmount);
    }
    return total;
  };

  const totalAmount = calculateTotal();

  // Обработчик использования бонусов
  const handleUseBonusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUseBonus(checked);
    if (checked) {
      setBonusAmount(availableBonus);
    } else {
      setBonusAmount(0);
    }
  };

  // Обработчик оформления заказа
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Проверяем тип доставки и наличие необходимых данных
      if (deliveryType === 'pickup' && !selectedBranch) {
        setError('Пожалуйста, выберите ресторан для самовывоза');
        setLoading(false);
        return;
      }

      if (deliveryType === 'delivery' && !defaultAddress) {
        setError('Пожалуйста, укажите адрес доставки');
        setLoading(false);
        return;
      }

      // Проверяем наличие товаров в корзине
      if (items.length === 0) {
        setError('Корзина пуста');
        setLoading(false);
        return;
      }

      // Подготавливаем данные заказа
      const orderData: any = {
        type: deliveryType,
        payment_method: paymentMethod,
        promo_code: promoCode || undefined,
        bonus_amount: useBonus ? bonusAmount : 0,
        phone: phone || undefined,
        comment: comment || undefined,
        utensils: utensils || undefined,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          modifications: item.modifications
        })),
        total_amount: totalAmount,
        subtotal: subtotal
      };

      // Добавляем данные в зависимости от типа доставки
      if (deliveryType === 'pickup' && selectedBranch) {
        orderData.branch_id = selectedBranch.id;
      } else if (deliveryType === 'delivery' && defaultAddress) {
        orderData.address_id = defaultAddress.id;
      }

      // Создаем заказ
      const success = await createOrder(orderData);

      if (success) {
        // Очищаем корзину
        clearCart();
        // Переходим на страницу успешного оформления
        navigate('/order-success');
      } else {
        setError('Не удалось оформить заказ. Пожалуйста, попробуйте снова.');
      }
    } catch (err) {
      setError('Произошла ошибка при оформлении заказа');
      console.error('Order submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Форматирование телефона для отображения
  const formatPhoneForDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    // Форматируем для отображения
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 1) return `+${cleaned}`;
    if (cleaned.length <= 4) return `+${cleaned.slice(0, 1)} ${cleaned.slice(1)}`;
    if (cleaned.length <= 7) return `+${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4)}`;
    if (cleaned.length <= 9) return `+${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return `+${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Сохраняем только цифры в state для отправки на сервер
    const digitsOnly = value.replace(/\D/g, '');
    setPhone(digitsOnly);
  };

  // Функция для получения стандартного формата телефона для валидации
  const getPhoneForInput = () => {
    return formatPhoneForDisplay(phone);
  };

  // Если загружается профиль, показываем индикатор
  if (isLoadingProfile) {
    return (
      <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-white">
      {/* Шапка с вкладками */}
      <div className="top-0 z-10 bg-white shadow-sm">
        {/* Заголовок */}
        <div className="p-4">
          {/* Вкладки Доставка/Самовывоз */}
          <div className="d-flex bg-light rounded-lg mb-3">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-center border-0 ${deliveryType === 'delivery' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => handleDeliveryTypeChange('delivery')}
              style={{
                fontWeight: deliveryType === 'delivery' ? 'bold' : 'normal',
                color: deliveryType === 'delivery' ? '#000' : '#6c757d'
              }}
            >
              Доставка
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-center border-0 ${deliveryType === 'pickup' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => handleDeliveryTypeChange('pickup')}
              style={{
                fontWeight: deliveryType === 'pickup' ? 'bold' : 'normal',
                color: deliveryType === 'pickup' ? '#000' : '#6c757d'
              }}
            >
              Самовывоз
            </button>
          </div>

          {/* Адрес в зависимости от типа доставки */}
          <div>
            {deliveryType === 'delivery' ? (
              defaultAddress ? (
                <p className="text-muted mb-0 small">
                  {defaultAddress.city && `${defaultAddress.city}, `}
                  {defaultAddress.street}, {defaultAddress.house}
                  {defaultAddress.apartment && `, кв. ${defaultAddress.apartment}`}
                </p>
              ) : (
                <button
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={() => navigate('/addresses')}
                  style={{ color: '#3b82f6', fontWeight: '500' }}
                >
                  Добавить адрес →
                </button>
              )
            ) : (
              selectedBranch ? (
                <p className="text-muted mb-0 small">
                  {selectedBranch.address}
                </p>
              ) : (
                <button
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={() => navigate('/restaurant-selection')}
                  style={{ color: '#3b82f6', fontWeight: '500' }}
                >
                  Выберите место самовывоза →
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <Container className="px-3 py-4">
        {error && (
          <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Секция способа оплаты */}
          <div className="mb-4">
            <h2 className="h6 fw-bold mb-3">СПОСОБ ОПЛАТЫ</h2>

            <div className="mb-3">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="paymentMethod"
                  id="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                <label className="form-check-label fw-medium" htmlFor="cash">
                  Наличными
                </label>
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center mb-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="promoCodeCheck"
                    checked={!!promoCode}
                    onChange={(e) => {
                      if (!e.target.checked) setPromoCode('');
                    }}
                  />
                  <label className="form-check-label fw-medium" htmlFor="promoCodeCheck">
                    Промокод
                  </label>
                </div>
              </div>
              {promoCode && (
                <Form.Control
                  type="text"
                  placeholder="Указать"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="mb-3">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="useBonus"
                  checked={useBonus}
                  onChange={handleUseBonusChange}
                />
                <label className="form-check-label fw-medium" htmlFor="useBonus">
                  Списать бонусы
                </label>
              </div>
              {useBonus && (
                <div className="mt-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">
                      У вас есть {userBonusBalance.toFixed(2)} бонусных рублей, из них вы можете списать {availableBonus.toFixed(2)}₽
                    </span>
                  </div>
                  <Form.Range
                    min="0"
                    max={availableBonus}
                    step="1"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value))}
                    className="mb-2"
                  />
                  <div className="d-flex justify-content-between">
                    <span className="text-muted small">0₽</span>
                    <span className="fw-medium">{bonusAmount.toFixed(2)}₽</span>
                    <span className="text-muted small">{availableBonus.toFixed(2)}₽</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Секция телефона - упрощенная версия */}
          <div className="mb-4">
            <h2 className="h6 fw-bold mb-3">ТЕЛЕФОН</h2>
            <Form.Control
              type="tel"
              placeholder="+7 917 123-46-78"
              value={getPhoneForInput()}
              onChange={handlePhoneChange}
              className="form-control-lg"
              style={{ fontSize: '16px' }}
              pattern="\+?[0-9\s\-\(\)]+"
              title="Введите номер телефона в международном формате"
              required
            />
            <Form.Text className="text-muted small">
              На этот номер придет уведомление о заказе
            </Form.Text>
          </div>

          {/* Комментарий к заказу */}
          <div className="mb-4">
            <h2 className="h6 fw-bold mb-3">КОММЕНТАРИЙ К ЗАКАЗУ</h2>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Введите комментарий"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Количество приборов */}
          <div className="mb-4">
            <h2 className="h6 fw-bold mb-3">КОЛИЧЕСТВО ПРИБОРОВ</h2>
            <div className="d-flex align-items-center" style={{ maxWidth: '150px' }}>
              <Form.Control
                type="number"
                min="1"
                max="10"
                placeholder="Например, 2"
                value={utensils}
                onChange={(e) => setUtensils(Math.max(1, Number(e.target.value)))}
                className="me-2"
              />
              <span className="text-muted">шт</span>
            </div>
          </div>

          {/* Итоговая сумма */}
          <div className="card border-0 bg-light mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Сумма заказа</span>
                <span className="fw-medium">{subtotal.toFixed(2)} ₽</span>
              </div>
              {useBonus && (
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Списано бонусов</span>
                  <span className="text-success fw-medium">-{bonusAmount.toFixed(2)} ₽</span>
                </div>
              )}
              {deliveryType === 'delivery' && (
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Доставка</span>
                  <span className="fw-medium">0 ₽</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Итого</span>
                <span className="h4 fw-bold text-primary">{totalAmount.toFixed(2)} ₽</span>
              </div>
            </div>
          </div>

          {/* Кнопка оформления заказа */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="btn btn-primary w-100 py-3 fw-bold"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px'
            }}
            disabled={loading || orderLoading || items.length === 0 ||
              (deliveryType === 'pickup' && !selectedBranch) ||
              (deliveryType === 'delivery' && !defaultAddress)}
          >
            {loading || orderLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Оформление...
              </>
            ) : (
              'Оформить заказ'
            )}
          </motion.button>
        </Form>
      </Container>
    </div>
  );
};

export default OrderPage;