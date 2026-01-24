import React from 'react';
import { useTelegram } from '../../hooks/useTelegram';

const TelegramStatus: React.FC = () => {
  const {
    isTelegramWebApp,
    user,
    version,
    platform,
    colorScheme,
    viewportHeight,
    viewportStableHeight,
    themeParams,
    isExpanded,
    initDataUnsafe
  } = useTelegram();

  React.useEffect(() => {
    console.log('[Telegram Mini App] TelegramStatus component mounted');
  }, []);

  if (!isTelegramWebApp) {
    return null; // Don't render anything when not in Telegram
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-100 border-b border-blue-300 p-2 text-xs z-50 overflow-y-auto max-h-40">
      <div className="font-bold mb-1">Telegram Mini App Status:</div>
      <div><span className="font-semibold">Environment:</span> Running in Telegram WebApp</div>
      <div><span className="font-semibold">Version:</span> {version || 'N/A'}</div>
      <div><span className="font-semibold">Platform:</span> {platform || 'N/A'}</div>
      <div><span className="font-semibold">Color Scheme:</span> {colorScheme || 'N/A'}</div>
      <div><span className="font-semibold">Is Expanded:</span> {isExpanded ? 'Yes' : 'No'}</div>
      <div><span className="font-semibold">Viewport Height:</span> {viewportHeight || 'N/A'}</div>
      <div><span className="font-semibold">Viewport Stable Height:</span> {viewportStableHeight || 'N/A'}</div>

      {user && (
        <div>
          <div className="font-semibold mt-1">User Info:</div>
          <div>ID: {user.id}</div>
          <div>Name: {user.first_name} {user.last_name || ''}</div>
          <div>Username: @{user.username || 'N/A'}</div>
          <div>Language: {user.language_code || 'N/A'}</div>
          <div>Is Premium: {user.is_premium ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default TelegramStatus;