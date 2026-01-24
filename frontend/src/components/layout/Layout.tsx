import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import TelegramStatus from '../utils/TelegramStatus';

const Layout: React.FC = () => {
  const { isTelegramWebApp, webApp } = useTelegram();

  React.useEffect(() => {
    console.log('[Telegram Mini App] Layout rendered - isTelegramWebApp:', isTelegramWebApp);

    if (isTelegramWebApp && webApp) {
      console.log('[Telegram Mini App] Setting theme colors in Layout');
      // Устанавливаем цвета темы
      webApp.setHeaderColor('#4e73df');
      webApp.setBackgroundColor('#f8f9fa');
    }
  }, [isTelegramWebApp, webApp]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TelegramStatus />
      {/* Header будет добавлен через дочерние компоненты */}
      <main className="pb-16 pt-40"> {/* Добавляем отступ сверху для статуса и снизу для нижней навигации */}
        <Outlet />
      </main>
      {!isTelegramWebApp && (
        <footer className="fixed bottom-0 w-full bg-white border-t p-2 text-center text-xs text-gray-500">
          Приложение работает в Telegram WebApp
        </footer>
      )}
    </div>
  );
};

export default Layout;