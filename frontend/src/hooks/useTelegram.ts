
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }

  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
      user?: TelegramUser;
      chat?: any;
      start_param?: string;
      auth_date: number;
      hash: string;
    };
    version: string;
    platform: string;
    colorScheme: string;
    themeParams: ThemeParams;
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    BackButton: BackButton;
    MainButton: MainButton;
    SettingsButton: SettingsButton;
    HapticFeedback: HapticFeedback;
    CloudStorage: CloudStorage;
    BiometricManager?: BiometricManager;
    closingBehavior: ClosingBehavior;

    onEvent(eventType: string, callback: Function): void;
    offEvent(eventType: string, callback: Function): void;
    ready(): void;
    expand(): void;
    close(): void;
    sendData(data: string): void;
    showNotification(message: string): void;
    showAlert(message: string): void;
    showConfirm(message: string, callback: (confirmed: boolean) => void): void;
    showPopup(params: PopupParams, callback?: (buttonId: string) => void): void;
    openLink(url: string, options?: OpenLinkOptions): void;
    openTelegramLink(url: string): void;
    openInvoice(url: string, callback: (status: string) => void): void;
    setHeaderColor(color: string): void;
    setBackgroundColor(color: string): void;
    setBottomBarColor(color: string): void;
    enableClosingConfirmation(): void;
    disableClosingConfirmation(): void;
  }

  interface TelegramUser {
    id: number;
    is_bot?: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    added_to_attachment_menu?: boolean;
    allows_write_to_pm?: boolean;
    photo_url?: string;
  }

  interface ThemeParams {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
  }

  interface BackButton {
    isVisible: boolean;
    onClick(callback: () => void): BackButton;
    offClick(callback: () => void): BackButton;
    show(): void;
    hide(): void;
  }

  interface MainButton {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): MainButton;
    onClick(callback: () => void): MainButton;
    offClick(callback: () => void): MainButton;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive: boolean): void;
    hideProgress(): void;
  }

  interface SettingsButton {
    isVisible: boolean;
    onClick(callback: () => void): SettingsButton;
    offClick(callback: () => void): SettingsButton;
    show(): void;
    hide(): void;
  }

  interface HapticFeedback {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  }

  interface CloudStorage {
    getItem(key: string, callback: (error: Error | null, value: string | null) => void): void;
    getItems(keys: string[], callback: (error: Error | null, values: { [key: string]: string }) => void): void;
    setItem(key: string, value: string, callback: (error: Error | null) => void): void;
    setItems(items: { [key: string]: string }, callback: (error: Error | null) => void): void;
    removeItem(key: string, callback: (error: Error | null) => void): void;
    removeItems(keys: string[], callback: (error: Error | null) => void): void;
  }

  interface BiometricManager {
    isBiometricAvailable(): Promise<boolean>;
    isAccessRequested(): Promise<boolean>;
    isAccessGranted(): Promise<boolean>;
    requestAccess(params: { reason: string }): Promise<'granted' | 'discarded'>;
    authenticate(params: { reason: string }): Promise<boolean>;
    updateBiometricToken(token: string): Promise<boolean>;
  }

  interface ClosingBehavior {
    enableConfirmation(): void;
    disableConfirmation(): void;
  }

  interface PopupParams {
    title?: string;
    message: string;
    buttons: PopupButton[];
  }

  interface PopupButton {
    id?: string;
    type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
    text?: string;
  }

  interface OpenLinkOptions {
    try_instant_view?: boolean;
  }
}

export interface TelegramWebAppContext {
  user?: TelegramUser;
  webApp?: TelegramWebApp;
  themeParams: ThemeParams;
  isTelegramWebApp: boolean;
  initData?: string;
  initDataUnsafe?: any;
  version?: string;
  platform?: string;
  colorScheme?: string;
  isExpanded?: boolean;
  viewportHeight?: number;
  viewportStableHeight?: number;
  headerColor?: string;
  backgroundColor?: string;
  isReady: boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: any) => void;
  showNotification: (message: string) => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
  showPopup: (params: PopupParams, callback?: (buttonId: string) => void) => void;
  openLink: (url: string, options?: OpenLinkOptions) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback: (status: string) => void) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
}

let telegramInitialized = false;

export const useTelegram = (): TelegramWebAppContext => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [themeParams, setThemeParams] = useState<ThemeParams>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('[Telegram Mini App] Initialization started');

    // Prevent multiple initializations
    if (telegramInitialized) {
      console.log('[Telegram Mini App] Already initialized, skipping');
      return;
    }

    // Log whether Telegram WebApp object is available
    const telegramAvailable = !!(window.Telegram?.WebApp);
    console.log('[Telegram Mini App] Telegram WebApp available:', telegramAvailable);

    if (!telegramAvailable) {
      console.log('[Telegram Mini App] Running outside of Telegram WebApp environment');
      return;
    }

    const tg = window.Telegram.WebApp;
    console.log('[Telegram Mini App] Telegram WebApp object:', tg);
    console.log('[Telegram Mini App] Version:', tg.version);
    console.log('[Telegram Mini App] Platform:', tg.platform);
    console.log('[Telegram Mini App] Color scheme:', tg.colorScheme);
    console.log('[Telegram Mini App] Is expanded:', tg.isExpanded);
    console.log('[Telegram Mini App] Viewport height:', tg.viewportHeight);
    console.log('[Telegram Mini App] Viewport stable height:', tg.viewportStableHeight);
    console.log('[Telegram Mini App] Header color:', tg.headerColor);
    console.log('[Telegram Mini App] Background color:', tg.backgroundColor);
    console.log('[Telegram Mini App] Theme params:', tg.themeParams);
    console.log('[Telegram Mini App] Init data (safe):', tg.initData ? 'Available' : 'Not available');
    console.log('[Telegram Mini App] Init data unsafe:', tg.initDataUnsafe);

    if (tg.initDataUnsafe?.user) {
      console.log('[Telegram Mini App] User info:', {
        id: tg.initDataUnsafe.user.id,
        firstName: tg.initDataUnsafe.user.first_name,
        lastName: tg.initDataUnsafe.user.last_name,
        username: tg.initDataUnsafe.user.username,
        languageCode: tg.initDataUnsafe.user.language_code,
        isPremium: tg.initDataUnsafe.user.is_premium
      });
    }

    // Initialize the app
    console.log('[Telegram Mini App] Calling tg.ready()');
    tg.ready();
    console.log('[Telegram Mini App] Calling tg.expand()');
    tg.expand();

    // Set colors based on theme
    console.log('[Telegram Mini App] Setting header color to #4e73df');
    tg.setHeaderColor('#4e73df');
    console.log('[Telegram Mini App] Setting background color to #f8f9fa');
    tg.setBackgroundColor('#f8f9fa');

    telegramInitialized = true;

    console.log('[Telegram Mini App] Storing WebApp instance');
    setWebApp(tg);
    setThemeParams(tg.themeParams);
    setIsReady(true);
    console.log('[Telegram Mini App] Initialization completed successfully');

    // Cleanup function to reset the flag when component unmounts
    return () => {
      telegramInitialized = false;
    };
  }, []);

  const isTelegramWebApp = !!webApp;
  console.log('[Telegram Mini App] Current Telegram status:', isTelegramWebApp);

  return {
    user: webApp?.initDataUnsafe?.user,
    webApp: webApp || undefined,
    themeParams,
    isTelegramWebApp,
    initData: webApp?.initData,
    initDataUnsafe: webApp?.initDataUnsafe,
    version: webApp?.version,
    platform: webApp?.platform,
    colorScheme: webApp?.colorScheme,
    isExpanded: webApp?.isExpanded,
    viewportHeight: webApp?.viewportHeight,
    viewportStableHeight: webApp?.viewportStableHeight,
    headerColor: webApp?.headerColor,
    backgroundColor: webApp?.backgroundColor,
    isReady,
    ready: () => {
      console.log('[Telegram Mini App] ready() method called');
      return webApp?.ready();
    },
    expand: () => {
      console.log('[Telegram Mini App] expand() method called');
      return webApp?.expand();
    },
    close: () => {
      console.log('[Telegram Mini App] close() method called');
      return webApp?.close();
    },
    sendData: (data: any) => {
      console.log('[Telegram Mini App] sendData() method called with data:', data);
      return webApp?.sendData(JSON.stringify(data));
    },
    showNotification: (message: string) => {
      console.log('[Telegram Mini App] showNotification() method called with message:', message);
      return webApp?.showNotification(message);
    },
    showAlert: (message: string) => {
      console.log('[Telegram Mini App] showAlert() method called with message:', message);
      return webApp?.showAlert(message);
    },
    showConfirm: (message: string, callback: (confirmed: boolean) => void) => {
      console.log('[Telegram Mini App] showConfirm() method called with message:', message);
      return webApp?.showConfirm(message, callback);
    },
    showPopup: (params: PopupParams, callback?: (buttonId: string) => void) => {
      console.log('[Telegram Mini App] showPopup() method called with params:', params);
      return webApp?.showPopup(params, callback);
    },
    openLink: (url: string, options?: OpenLinkOptions) => {
      console.log('[Telegram Mini App] openLink() method called with url:', url, 'and options:', options);
      return webApp?.openLink(url, options);
    },
    openTelegramLink: (url: string) => {
      console.log('[Telegram Mini App] openTelegramLink() method called with url:', url);
      return webApp?.openTelegramLink(url);
    },
    openInvoice: (url: string, callback: (status: string) => void) => {
      console.log('[Telegram Mini App] openInvoice() method called with url:', url);
      return webApp?.openInvoice(url, callback);
    },
    setHeaderColor: (color: string) => {
      console.log('[Telegram Mini App] setHeaderColor() method called with color:', color);
      return webApp?.setHeaderColor(color);
    },
    setBackgroundColor: (color: string) => {
      console.log('[Telegram Mini App] setBackgroundColor() method called with color:', color);
      return webApp?.setBackgroundColor(color);
    },
    enableClosingConfirmation: () => {
      console.log('[Telegram Mini App] enableClosingConfirmation() method called');
      return webApp?.enableClosingConfirmation();
    },
    disableClosingConfirmation: () => {
      console.log('[Telegram Mini App] disableClosingConfirmation() method called');
      return webApp?.disableClosingConfirmation();
    },
  };
};