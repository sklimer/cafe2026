
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Form, Button, Modal } from 'react-bootstrap';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { useCartStore } from '../stores/cartStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { Address } from '../types';
import { apiClient } from '../api/client';

const AddressSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { subtotal, totalItems } = useCartStore();
  const { userAddresses, addNewAddress, selectedAddress, setSelectedAddress } = useDeliveryStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Состояния формы
  const [formData, setFormData] = useState({
    alias: '',
    address: '',
    city: '',
    street: '',
    house: '',
    entrance: '',
    floor: '',
    apartment: '',
    intercom: '',
    comment: '',
    latitude: '',
    longitude: '',
    geolocation_accuracy: '',
    isDefault: false,
    isVerified: false
  });

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Используем кнопку "Назад" Telegram Mini Apps
  useTelegramBackButton(handleBack, true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Проверка обязательных полей
    if (!formData.alias.trim()) {
      setError('Пожалуйста, укажите метку адреса');
      setLoading(false);
      return;
    }

    if (!formData.street.trim()) {
      setError('Пожалуйста, укажите улицу');
      setLoading(false);
      return;
    }

    if (!formData.house.trim()) {
      setError('Пожалуйста, укажите номер дома');
      setLoading(false);
      return;
    }

    try {
      // Подготовка данных для отправки, используя правильные поля для API
      const fullAddress = formData.address ||
        (formData.street && formData.house ?
          `${formData.street}, ${formData.house}` :
          (formData.street || formData.house || 'Адрес'));

      const addressData = {
        alias: formData.alias.trim(),
        address: fullAddress.trim(),
        city: formData.city?.trim() || '',
        street: formData.street.trim(),
        house: formData.house.trim(),
        entrance: formData.entrance?.trim() || '',
        floor: formData.floor?.trim() || '',
        apartment: formData.apartment?.trim() || '',
        intercom: formData.intercom?.trim() || '',
        comment: formData.comment?.trim() || '',
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        geolocation_accuracy: formData.geolocation_accuracy?.trim() || null,
        is_default: formData.isDefault,
        is_verified: formData.isVerified
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
          alias: '',
          address: '',
          city: '',
          street: '',
          house: '',
          entrance: '',
          floor: '',
          apartment: '',
          intercom: '',
          comment: '',
          latitude: '',
          longitude: '',
          geolocation_accuracy: '',
          isDefault: false,
          isVerified: false
        });
      } else {
        setError(response.error || 'Не удалось добавить адрес');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при добавлении адреса');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
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
          <h1 className="h2 fw-bold text-dark mb-3">ВЫБЕРИТЕ АДРЕС</h1>
        </div>

        {/* Список адресов */}
        <div className="mb-4">
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
                      <span className="badge bg-primary">Основной</span>
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
            </div>
          )}
        </div>

        {/* Кнопка добавления адреса */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary btn-lg w-100 py-3 fw-bold"
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
      </Container>

      {/* Модальное окно для добавления адреса */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить адрес</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Метка *</Form.Label>
              <Form.Control
                type="text"
                name="alias"
                value={formData.alias}
                onChange={handleInputChange}
                required
                placeholder="Например: Дом, Работа"
              />
            </Form.Group>

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

            <Form.Group className="mb-3">
              <Form.Label>Широта</Form.Label>
              <Form.Control
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="Широта (необязательно)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Долгота</Form.Label>
              <Form.Control
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="Долгота (необязательно)"
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              name="isDefault"
              label="Сделать основным адресом"
              checked={formData.isDefault}
              onChange={handleInputChange}
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              name="isVerified"
              label="Адрес проверен"
              checked={formData.isVerified}
              onChange={handleInputChange}
              className="mb-3"
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
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