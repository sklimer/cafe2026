import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { Product, Category } from '../types';
import { apiClient, getFullImageUrl } from '../api/client';
import { useQuery } from '@tanstack/react-query';
import { Container, Row, Col } from 'react-bootstrap';




// Вспомогательная функция для безопасного доступа к тегам
const getProductTags = (product: any): any[] => {
  if (!product) return [];
  if (Array.isArray(product.tags)) return product.tags;
  if (product.tags && typeof product.tags === 'object') {
    return Object.values(product.tags);
  }
  return [];
};

// Функция для рендеринга бейджей
const renderBadge = (tag: any, index: number) => {
  if (!tag || !tag.name) return null;

  const tagName = tag.name.toLowerCase();

  // Определение цветов для бейджей с синей темой
  const getBadgeStyle = (tag: string) => {
    switch(tag) {
      case 'острый':
        return 'bg-danger text-white';
      case 'хит':
        return 'bg-warning text-dark';
      case 'новинка':
        return 'bg-success text-white';
      case 'скидка':
        return 'bg-primary text-white';
      case 'от шефа':
        return 'bg-dark text-white';
      default:
        return 'bg-secondary text-white';
    }
  };

  const getBadgeText = (tagName: string) => {
    switch(tagName) {
      case 'острый': return '🌶️';
      case 'хит': return '🔥';
      case 'новинка': return '🆕';
      case 'скидка': return '💰';
      case 'от шефа': return '👨‍🍳';
      default: return tag.name;
    }
  };

  return (
    <motion.div
      key={index}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`position-absolute top-0 start-0 px-2 py-1 text-xs fw-bold rounded m-2 ${getBadgeStyle(tagName)} shadow-sm`}
      style={{ zIndex: 1 }}
    >
      {getBadgeText(tagName)}
    </motion.div>
  );
};

// Компонент для изображения с запасным вариантом
const ProductImage: React.FC<{ src: string | null; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light rounded">
        <span className="display-4 text-muted">🍔</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-100 h-100 object-fit-cover rounded"
      onError={() => setHasError(true)}
      style={{ borderRadius: '12px' }}
    />
  );
};

const ChatBurgerMenu: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, subtotal, items, totalItems } = useCartStore();
  const headerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const prevScrollY = useRef(0);

  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showHeader, setShowHeader] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categoriesFixed, setCategoriesFixed] = useState(false);

  // Загрузка данных
  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu'],
    queryFn: () => apiClient.getCategories().then(res => {
      console.log('API Response:', res);
      return res;
    }),
    onError: (error) => {
      console.error('Error loading menu:', error);
    }
  });

  // Защита от undefined
  const categories = Array.isArray(menuData?.data?.categories)
    ? menuData.data.categories
    : [];

  const products = Array.isArray(menuData?.data?.products)
    ? menuData.data.products
    : [];

  // Установка активной категории
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      const firstCategory = categories[0];
      setActiveCategory(firstCategory.id.toString());
    }
  }, [categories]);

  // Группировка продуктов по категориям
  const productsByCategories = categories.reduce((acc, category) => {
    const categoryProducts = products.filter(product => {
      const productCategoryId = product.categoryId || product.category;
      return productCategoryId?.toString() === category.id.toString();
    });

    if (categoryProducts.length > 0) {
      acc.push({
        ...category,
        products: categoryProducts
      });
    }

    return acc;
  }, [] as Array<Category & { products: Product[] }>);

  // Добавление в корзину при клике на карточку
  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1, []);

    // Анимация добавления
    const priceElement = document.getElementById(`price-${product.id}`);
    if (priceElement) {
      priceElement.classList.add('animate__pulse', 'animate__faster');
      setTimeout(() => {
        priceElement.classList.remove('animate__pulse', 'animate__faster');
      }, 300);
    }
  };

  // Обработчик прокрутки
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const headerHeight = headerRef.current?.offsetHeight || 0;
      const categoriesTop = categoriesRef.current?.offsetTop || 0;

      // Проверяем, коснулись ли категории верха экрана
      if (currentScrollY >= categoriesTop - 60) {
        setCategoriesFixed(true);
      } else {
        setCategoriesFixed(false);
      }

      // Управление видимостью хедера при скролле
      if (currentScrollY > 100) {
        setIsScrolled(true);
        if (currentScrollY > prevScrollY.current) {
          // Скролл вниз
          setShowHeader(false);
        } else {
          // Скролл вверх
          setShowHeader(true);
        }
      } else {
        setIsScrolled(false);
        setShowHeader(true);
      }

      prevScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Функция для обработки смены категории
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = categoriesFixed ? 120 : 200; // Учитываем фиксированное меню
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!menuData?.success) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 p-4 bg-light">
        <div className="display-1 mb-4 animate__animated animate__bounce">🍔</div>
        <h2 className="h2 mb-2 text-dark">Не удалось загрузить меню</h2>
        <p className="text-muted text-center mb-4">
          {menuData?.error || 'Произошла ошибка при загрузке данных'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary text-white px-5 py-3 fw-bold shadow"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-white pb-5">
      {/* Основной хедер */}
      <motion.header
        ref={headerRef}
        initial={{ y: 0 }}
        animate={{ y: showHeader ? 0 : -80 }}
        transition={{ duration: 0.3 }}
        className={`sticky-top bg-white border-bottom ${isScrolled ? 'shadow-sm' : ''}`}
      >
        <Container className="px-3 pt-3">
          {/* Переключатель доставки */}
          <div className="mb-3">
            <div className="d-inline-flex rounded bg-light p-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={`btn btn-sm px-4 py-2 ${orderType === 'delivery' ? 'btn-light shadow-sm text-primary' : 'btn-text'}`}
                onClick={() => {
                  setOrderType('delivery');
                  navigate('/delivery');
                }}
              >
                <span className="me-1">🚚</span>
                Доставка
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={`btn btn-sm px-4 py-2 ${orderType === 'pickup' ? 'btn-light shadow-sm text-primary' : 'btn-text'}`}
                onClick={() => {
                  setOrderType('pickup');
                  navigate('/pickup');
                }}
              >
                <span className="me-1">🏃</span>
                Самовывоз
              </motion.button>
            </div>
          </div>

          {/* Категории продуктов - основной блок */}
          <div ref={categoriesRef}>
            <Container className="px-3">
              <div className="py-2">
                <div className="d-flex overflow-auto gap-3">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`btn btn-sm ${activeCategory === category.id.toString() ? 'btn-primary text-white shadow' : 'btn-light'} px-3 py-2 text-nowrap`}
                      onClick={() => handleCategoryChange(category.id.toString())}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </Container>
          </div>
        </Container>
      </motion.header>

      {/* Основной контент */}
      <Container className="px-3 pt-4" style={{ paddingBottom: '70px' }}>
        {products.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="display-1 mb-4">🍔</div>
            <h2 className="h4 mb-2 text-dark">Меню пусто</h2>
            <p className="text-muted text-center">В данный момент нет доступных блюд</p>
          </div>
        ) : (
          <div>
            {productsByCategories.map(categorySection => (
              <div key={categorySection.id} id={`category-${categorySection.id}`} className="mb-4">
                {/* Заголовок категории */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h4 fw-bold text-dark mb-0">{categorySection.name}</h2>
                  {categorySection.name === 'Бугреры' && (
                    <div className="d-flex gap-2">
                      <div className="d-flex align-items-center">
                        <small className="text-muted me-1">4.4</small>
                        <i className="bi bi-star-fill text-warning" style={{ fontSize: '12px' }}></i>
                      </div>
                      <div className="d-flex align-items-center">
                        <small className="text-muted me-1">4.8</small>
                        <i className="bi bi-star-fill text-warning" style={{ fontSize: '12px' }}></i>
                      </div>
                    </div>
                  )}
                </div>

                {/* Продукты категории - 2 колонки */}
                <Row className="g-3">
                  {categorySection.products.map((product, index) => {
                    const mainImageUrl = getFullImageUrl(product.main_image_url);
                    const firstImageUrl = product.image_urls && product.image_urls.length > 0
                      ? getFullImageUrl(product.image_urls[0])
                      : null;
                    const imageUrl = mainImageUrl || firstImageUrl;

                    return (
                      <Col key={product.id} xs={6}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="card h-100 border shadow-sm"
                          onClick={(e) => handleAddToCart(product, e)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Изображение с закругленными углами */}
                          <div className="position-relative" style={{ height: '140px' }}>
                            <div className="h-100 w-100 overflow-hidden rounded-top">
                              <ProductImage src={imageUrl} alt={product.name} />
                            </div>

                            {/* Бейджи поверх изображения */}
                            <div className="position-absolute top-0 start-0 end-0 p-2">
                              <div className="d-flex flex-wrap gap-1">
                                {getProductTags(product).map((tag, index) =>
                                  renderBadge(tag, index)
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Контент продукта */}
                          <div className="card-body p-3">
                            {/* Название товара - шрифт 16px, без горизонтальных отступов */}
                            <h3
                              className="card-title fw-bold text-dark mb-1"
                              style={{
                                fontSize: '16px',
                                lineHeight: '1.3',
                                paddingLeft: '0',
                                paddingRight: '0'
                              }}
                            >
                              {product.name}
                            </h3>

                            {/* Описание товара - шрифт 12px, 2 строки, без горизонтальных отступов */}
                            {product.description && (
                              <p
                                className="text-muted mb-2"
                                style={{
                                  fontSize: '12px',
                                  lineHeight: '1.4',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  minHeight: '2.8em',
                                  paddingLeft: '0',
                                  paddingRight: '0'
                                }}
                                title={product.description}
                              >
                                {product.description}
                              </p>
                            )}

                            {/* Цена и кнопка добавления */}
                            <div className="d-flex justify-content-between align-items-center mt-2" style={{ paddingLeft: '0', paddingRight: '0' }}>
                              <div id={`price-${product.id}`} className="d-flex align-items-baseline gap-1">
                                <span className="h5 fw-bold text-dark mb-0">
                                  {Number(product.price).toFixed(0)} ₽
                                </span>
                                {product.old_price && (
                                  <small className="text-muted text-decoration-line-through">
                                    {Number(product.old_price).toFixed(0)} ₽
                                  </small>
                                )}
                              </div>

                              {/* Иконка добавления */}
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                }}
                              >
                                <span className="text-white fw-bold">+</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* ФИКСИРОВАННАЯ КНОПКА КОРЗИНЫ - ОБНОВЛЕННЫЙ КОД */}

      <div
        className="position-fixed bottom-0 start-0 end-0"
        style={{
          zIndex: 9999, // Очень высокий z-index
          height: '70px', // Увеличиваем высоту
          backgroundColor: 'white', // Белый фон под кнопкой
          boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.1)' // Тень сверху
        }}
      >
        <div className="h-100 w-100 px-3 py-2">
          <button
            className={`btn w-100 h-100 d-flex align-items-center justify-content-center rounded-3 shadow ${totalItems() === 0 ? 'opacity-75' : ''}`}
          onClick={() => totalItems() > 0 && navigate('/cart')}
          disabled={totalItems() === 0}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              fontSize: '18px', // Увеличиваем шрифт
              fontWeight: '700', // Делаем жирнее
              border: 'none',
              minHeight: '56px' // Минимальная высота
            }}
          >
            <span className="d-flex align-items-center gap-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Корзина {Number(subtotal).toFixed(0)} ₽
            </span>
          </button>
        </div>
      </div>

      {/* ДОБАВЛЯЕМ ПРОЗРАЧНЫЙ ПЛЕЙСХОЛДЕР ДЛЯ ВЫСОТЫ */}
      <div style={{ height: '70px' }}></div>
    </div>
  );
};

export default ChatBurgerMenu;