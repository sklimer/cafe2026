import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  const [isInTelegram, setIsInTelegram] = React.useState(false);
  const [webApp, setWebApp] = React.useState<any>(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    console.log('[Telegram Mini App] Layout useEffect running');

    const tg = window.Telegram?.WebApp;
    console.log('[Telegram Mini App] Direct check in Layout:', !!tg);

    if (tg) {
      console.log('[Telegram Mini App] Initializing WebApp in Layout');

      tg.ready();
      tg.expand();
      tg.setHeaderColor('#4e73df');
      tg.setBackgroundColor('#f8f9fa');

      setWebApp(tg);
      setIsInTelegram(true);
      setIsReady(true);

      console.log('[Telegram Mini App] Layout state updated to true');
    } else {
      console.log('[Telegram Mini App] No WebApp, setting ready state');
      setIsReady(true);
    }
  }, []);

  console.log('[Telegram Mini App] Layout rendered - isInTelegram:', isInTelegram);

  // Можно показать лоадер пока не определили состояние
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Простой тестовый компонент */}
      <div className="p-4">
        <h1 className="text-2xl font-bold">Тестовая страница</h1>
        <p>isInTelegram: {isInTelegram ? 'Да' : 'Нет'}</p>
        <p>Проверка отображения контента</p>
      </div>

      <main className={`pb-16 ${isInTelegram ? 'pt-40' : 'pt-4'}`}>
        <Outlet />
      </main>

      {isInTelegram && (
        <footer className="fixed bottom-0 w-full bg-white border-t p-2 text-center text-xs text-gray-500">
          Приложение работает в Telegram WebApp
        </footer>
      )}
    </div>
  );
};

export default Layout;