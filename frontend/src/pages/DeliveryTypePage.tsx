import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Spinner, Alert, Modal, Form, Button } from 'react-bootstrap';
import { useCartStore } from '../stores/cartStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { Address } from '../types';
import { apiClient } from '../api/client';

const DeliveryTypePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subtotal } = useCartStore();
  const {
    userAddresses,
    selectedAddress,
    setSelectedAddress,
    loadDeliveryPreferences,
    updateAddressInStore,
    addNewAddress
  } = useDeliveryStore();

  const [loadingAddressId, setLoadingAddressId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Состояния для добавления адреса
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    city: '',
    street: '',
    house: '',
    entrance: '',
    floor: '',
    apartment: '',
    intercom: '',
    comment: ''
  });

  useEffect(() => {
    // Загружаем сохраненные настройки доставки
    loadDeliveryPreferences();

    // Проверяем, нужно ли показать модальное окно добавления адреса
    if (location.state?.showAddModal) {
      setShowAddModal(true);
      // Очищаем state после использования
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [loadDeliveryPreferences, location, navigate]);

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

  const handleAddressSelect = async (address: Address) => {
    try {
      setLoadingAddressId(address.id);
      setError(null);

      // Сначала делаем адрес основным
      const updateData = {
        ...address,
        is_default: true
      };

      // Отправляем запрос на сервер
      const response = await apiClient.updateAddress(String(address.id), updateData);

      if (response.success) {
        // Обновляем адрес в локальном хранилище
        if (updateAddressInStore) {
          updateAddressInStore(address.id, { is_default: true });
        }

        // Устанавливаем адрес как выбранный
        setSelectedAddress({ ...address, is_default: true });

        // Возвращаемся на предыдущую страницу
        navigate(-1);
      } else {
        setError(response.error || 'Не удалось обновить адрес');
      }
    } catch (err) {
      setError('Произошла ошибка при выборе адреса');
      console.error('Error setting default address:', err);
    } finally {
      setLoadingAddressId(null);
    }
  };

  // Обработчики для формы добавления адреса
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    // Проверка обязательных полей
    if (!formData.street.trim()) {
      setFormError('Пожалуйста, укажите улицу');
      setLoading(false);
      return;
    }

    if (!formData.house.trim()) {
      setFormError('Пожалуйста, укажите номер дома');
      setLoading(false);
      return;
    }

    try {
      // Подготовка данных для отправки, используя правильные поля для API
      const fullAddress = formData.street && formData.house ?
        `${formData.street}, ${formData.house}` :
        (formData.street || formData.house || 'Адрес');

      const addressData = {
        alias: `${formData.street}, ${formData.house}`, // Генерируем алиас автоматически
        address: fullAddress.trim(),
        city: formData.city?.trim() || '',
        street: formData.street.trim(),
        house: formData.house.trim(),
        entrance: formData.entrance?.trim() || '',
        floor: formData.floor?.trim() || '',
        apartment: formData.apartment?.trim() || '',
        intercom: formData.intercom?.trim() || '',
        comment: formData.comment?.trim() || ''
      };

      // Отправка запроса в API
      const response = await apiClient.createAddress(addressData);

      if (response.success && response.data) {
        // Обновляем список адресов в store
        const newAddress = response.data as Address;
        addNewAddress(newAddress);

        // Закрываем модальное окно
        setShowAddModal(false);

        // Сбрасываем форму
        setFormData({
          city: '',
          street: '',
          house: '',
          entrance: '',
          floor: '',
          apartment: '',
          intercom: '',
          comment: ''
        });
      } else {
        setFormError(response.error || 'Не удалось добавить адрес');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Произошла ошибка при добавлении адреса');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormError(null);
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

        {/* Сообщение об ошибке */}
        {error && (
          <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {/* Список адресов */}
        <div className="mb-4">
          {userAddresses.length > 0 ? (
            userAddresses.map((address) => (
              <div
                key={address.id}
                className={`card border mb-3 position-relative ${selectedAddress?.id === address.id ? 'border-primary' : ''}`}
                style={{
                  cursor: 'pointer',
                  borderWidth: selectedAddress?.id === address.id ? '2px' : '1px'
                }}
                onClick={() => !loadingAddressId && handleAddressSelect(address)}
              >
                {/* Галочка для выбранного адреса */}
                {selectedAddress?.id === address.id && (
                  <div className="position-absolute top-0 end-0 m-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                )}

                <div className="card-body">
                  {/* Индикатор загрузки */}
                  {loadingAddressId === address.id && (
                    <div className="position-absolute top-0 end-0 p-2">
                      <Spinner animation="border" size="sm" variant="primary" />
                    </div>
                  )}

                  {/* Основная информация об адресе */}
                  <div className="mb-2">
                    {/* Улица, Дом - основной текст */}
                    <p className="text-dark fw-bold mb-1">
                      {address.city
                        ? `${address.city}, ${address.street}, ${address.house}`
                        : `${address.street}, ${address.house}`
                      }
                    </p>

                    {/* Дополнительные детали в одной строке */}
                    <div className="text-muted small">
                      {address.apartment && (
                        <span className="me-3">Кв. {address.apartment}</span>
                      )}
                      {address.intercom && (
                        <span>Домофон: {address.intercom}</span>
                      )}
                    </div>

                    {/* Комментарий (если есть) */}
                    {address.comment && (
                      <p className="text-muted small mb-0 mt-2">
                        <i>{address.comment}</i>
                      </p>
                    )}
                  </div>

                  {/* Подсказка для невыбранных адресов */}
                  {selectedAddress?.id !== address.id && (
                    <div className="mt-2 text-primary small">
                      Нажмите для выбора
                    </div>
                  )}

                  {/* Подсказка для выбранного адреса */}
                  {selectedAddress?.id === address.id && (
                    <div className="mt-2 text-success small">
                      ✓ Выбран для доставки
                    </div>
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
                onClick={() => setShowAddModal(true)}
              >
                + Добавить адрес
              </motion.button>
            </div>
          )}
        </div>

        {/* Кнопка добавления адреса (отображается всегда при наличии адресов) */}
        {userAddresses.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="btn btn-outline-primary w-100 py-3 fw-bold mb-4"
            style={{
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              fontSize: '16px',
              color: '#3b82f6'
            }}
            onClick={() => setShowAddModal(true)}
          >
            + Добавить новый адрес
          </motion.button>
        )}
      </Container>

      {/* Модальное окно для добавления адреса */}
      <Modal show={showAddModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить адрес</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && (
            <div className="alert alert-danger">{formError}</div>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Город</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Введите город"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Улица *</Form.Label>
              <Form.Control
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                required
                placeholder="Введите название улицы"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Номер дома *</Form.Label>
              <Form.Control
                type="text"
                name="house"
                value={formData.house}
                onChange={handleInputChange}
                required
                placeholder="Например: 88"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Квартира</Form.Label>
              <Form.Control
                type="text"
                name="apartment"
                value={formData.apartment}
                onChange={handleInputChange}
                placeholder="Например: 123"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Подъезд</Form.Label>
              <Form.Control
                type="text"
                name="entrance"
                value={formData.entrance}
                onChange={handleInputChange}
                placeholder="Например: 2"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Этаж</Form.Label>
              <Form.Control
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
                placeholder="Например: 3"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Домофон</Form.Label>
              <Form.Control
                type="text"
                name="intercom"
                value={formData.intercom}
                onChange={handleInputChange}
                placeholder="Например: 1234"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Комментарий</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="Дополнительная информация для курьера"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Добавление...' : 'Добавить'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DeliveryTypePage;