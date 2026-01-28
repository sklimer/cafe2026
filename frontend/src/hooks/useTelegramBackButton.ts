// hooks/useTelegramBackButton.ts
import { useEffect, useRef, useCallback } from 'react';

export const useTelegramBackButton = (onClick: () => void, show = true) => {
  const onClickRef = useRef(onClick);

  // Обновляем ref при изменении onClick
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!window.Telegram?.WebApp?.BackButton) {
      console.log('BackButton not available');
      return () => {}; // Возвращаем пустую функцию очистки
    }

    console.log('Setting up BackButton');
    const backButton = window.Telegram.WebApp.BackButton;

    // Создаем обработчик, который вызывает текущую функцию
    const handleClick = () => {
      console.log('BackButton clicked, calling onClick');
      onClickRef.current();
    };

    // Устанавливаем обработчик
    backButton.onClick(handleClick);

    if (show) {
      backButton.show();
      console.log('BackButton shown');
    } else {
      backButton.hide();
    }

    // Функция очистки
    return () => {
      console.log('Cleaning up BackButton');
      backButton.offClick(handleClick);
      backButton.hide(); // Всегда скрываем при размонтировании
    };
  }, [show]);
};

// Вспомогательный хук для навигации назад
export const useBackNavigation = () => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    console.log('Navigating back');
    navigate(-1);
  }, [navigate]);

  return handleBack;
};