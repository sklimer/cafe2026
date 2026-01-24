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

// Глобальные переменные для хранения состояния
let globalWebApp: TelegramWebApp | null = null;
let globalIsReady = false;
let globalThemeParams: ThemeParams = {};
let globalInitializationPromise: Promise<void> | null = null;

export const useTelegram = (): TelegramWebAppContext => {
  const [state, setState] = useState({
    webApp: null as TelegramWebApp | null,
    isReady: false,
    themeParams: {} as ThemeParams,
    isTelegramWebApp: false
  });

  useEffect(() => {
    console.log('[Telegram Mini App] Hook initialization started');

    const tg = window.Telegram?.WebApp;

    if (!tg) {
      console.log('[Telegram Mini App] Running outside of Telegram WebApp environment');
      return;
    }

    console.log('[Telegram Mini App] Telegram WebApp available:', true);
    console.log('[Telegram Mini App] Version:', tg.version);
    console.log('[Telegram Mini App] Platform:', tg.platform);

    // Инициализация
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#4e73df');
    tg.setBackgroundColor('#f8f9fa');

    setState({
      webApp: tg,
      isReady: true,
      themeParams: tg.themeParams || {},
      isTelegramWebApp: true
    });

    console.log('[Telegram Mini App] Hook initialization completed');
  }, []);

  return {
    user: state.webApp?.initDataUnsafe?.user,
    webApp: state.webApp || undefined,
    themeParams: state.themeParams,
    isTelegramWebApp: state.isTelegramWebApp,
    initData: state.webApp?.initData,
    initDataUnsafe: state.webApp?.initDataUnsafe,
    version: state.webApp?.version,
    platform: state.webApp?.platform,
    colorScheme: state.webApp?.colorScheme,
    isExpanded: state.webApp?.isExpanded,
    viewportHeight: state.webApp?.viewportHeight,
    viewportStableHeight: state.webApp?.viewportStableHeight,
    headerColor: state.webApp?.headerColor,
    backgroundColor: state.webApp?.backgroundColor,
    isReady: state.isReady,
    ready: () => state.webApp?.ready(),
    expand: () => state.webApp?.expand(),
    close: () => state.webApp?.close(),
    sendData: (data: any) => state.webApp?.sendData(JSON.stringify(data)),
    showNotification: (message: string) => state.webApp?.showNotification(message),
    showAlert: (message: string) => state.webApp?.showAlert(message),
    showConfirm: (message: string, callback: (confirmed: boolean) => void) =>
      state.webApp?.showConfirm(message, callback),
    showPopup: (params: PopupParams, callback?: (buttonId: string) => void) =>
      state.webApp?.showPopup(params, callback),
    openLink: (url: string, options?: OpenLinkOptions) =>
      state.webApp?.openLink(url, options),
    openTelegramLink: (url: string) => state.webApp?.openTelegramLink(url),
    openInvoice: (url: string, callback: (status: string) => void) =>
      state.webApp?.openInvoice(url, callback),
    setHeaderColor: (color: string) => state.webApp?.setHeaderColor(color),
    setBackgroundColor: (color: string) => state.webApp?.setBackgroundColor(color),
    enableClosingConfirmation: () => state.webApp?.enableClosingConfirmation(),
    disableClosingConfirmation: () => state.webApp?.disableClosingConfirmation(),
  };
};

// Вспомогательная функция для прямого доступа к WebApp (если нужно вне хуков)
export const getTelegramWebApp = (): TelegramWebApp | null => {
  return globalWebApp;
};

// Вспомогательная функция для проверки, инициализирован ли WebApp
export const isTelegramInitialized = (): boolean => {
  return globalIsReady && !!globalWebApp;
};