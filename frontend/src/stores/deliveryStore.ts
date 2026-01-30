import { create } from 'zustand';
import { Address, Branch } from '../types';
import { apiClient } from '../api/client';

interface DeliveryState {
  deliveryType: 'delivery' | 'pickup' | null;
  selectedAddress: Address | null;
  selectedBranch: Branch | null;
  userAddresses: Address[];
  userBranches: Branch[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setDeliveryType: (type: 'delivery' | 'pickup') => Promise<void>;
  setSelectedAddress: (address: Address | null) => void;
  setSelectedBranch: (branch: Branch | null) => void;
  setUserAddresses: (addresses: Address[]) => void;
  setUserBranches: (branches: Branch[]) => void;
  setDefaultAddress: (addressId: string) => void;
  addNewAddress: (address: Address) => void;
  updateAddress: (address: Address) => void;
  removeAddress: (addressId: string) => void;
  saveDeliveryPreferences: () => void;
  loadDeliveryPreferences: () => Promise<void>;
  updateAddressInStore: (addressId: number, updates: Partial<Address>) => void;
  loadPreferencesFromServer: () => Promise<void>;
  savePreferencesToServer: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  deliveryType: null,
  selectedAddress: null,
  selectedBranch: null,
  userAddresses: [],
  userBranches: [],
  isLoading: false,
  error: null,

  setDeliveryType: async (type) => {
    set({ deliveryType: type });

    // Сохраняем в localStorage
    localStorage.setItem('deliveryType', type);

    // Сохраняем на сервере
    try {
      const success = await get().savePreferencesToServer();
      if (!success) {
        console.warn('Не удалось сохранить тип доставки на сервере');
      }
    } catch (err) {
      console.error('Error saving delivery type to server:', err);
    }
  },

  setSelectedAddress: (address) => {
    set({ selectedAddress: address });
    if (address) {
      localStorage.setItem('selectedAddress', JSON.stringify(address));
    } else {
      localStorage.removeItem('selectedAddress');
    }
  },

  setSelectedBranch: async (branch) => {
    set({ selectedBranch: branch });
    if (branch) {
      localStorage.setItem('selectedBranch', JSON.stringify(branch));

      // Если выбрана ветка, сохраняем на сервере
      try {
        await get().savePreferencesToServer();
      } catch (err) {
        console.error('Error saving branch to server:', err);
      }
    } else {
      localStorage.removeItem('selectedBranch');
    }
  },

  setUserAddresses: (addresses) => {
    set({ userAddresses: addresses });
    localStorage.setItem('userAddresses', JSON.stringify(addresses));
  },

  setUserBranches: (branches) => {
    set({ userBranches: branches });
    localStorage.setItem('userBranches', JSON.stringify(branches));
  },

  setDefaultAddress: (addressId) => {
    set(state => {
      const updatedAddresses = state.userAddresses.map(address => ({
        ...address,
        is_default: address.id === addressId
      }));

      // Find the new default address
      const newDefaultAddress = updatedAddresses.find(addr => addr.id === addressId) || null;

      // Update selected address if needed
      const newSelectedAddress = newDefaultAddress || state.selectedAddress;

      return {
        userAddresses: updatedAddresses,
        selectedAddress: newSelectedAddress
      };
    });

    // Also update in localStorage
    const state = get();
    localStorage.setItem('userAddresses', JSON.stringify(state.userAddresses));
    if (state.selectedAddress) {
      localStorage.setItem('selectedAddress', JSON.stringify(state.selectedAddress));
    }
  },

  addNewAddress: (address) => {
    set(state => {
      // Check if this is the first address, then make it default
      const isFirstAddress = state.userAddresses.length === 0;
      const newAddress = {
        ...address,
        is_default: isFirstAddress
      };

      const updatedAddresses = [...state.userAddresses, newAddress];

      // If this is the first address, also set it as selected
      const newSelectedAddress = isFirstAddress ? newAddress : state.selectedAddress;

      return {
        userAddresses: updatedAddresses,
        selectedAddress: newSelectedAddress
      };
    });

    // Also update in localStorage
    const state = get();
    localStorage.setItem('userAddresses', JSON.stringify(state.userAddresses));
    if (state.selectedAddress) {
      localStorage.setItem('selectedAddress', JSON.stringify(state.selectedAddress));
    }
  },

  updateAddress: (updatedAddress) => {
    set(state => {
      const updatedAddresses = state.userAddresses.map(addr =>
        addr.id === updatedAddress.id ? updatedAddress : addr
      );

      // If updating the selected address, update the reference
      const newSelectedAddress = state.selectedAddress?.id === updatedAddress.id
        ? updatedAddress
        : state.selectedAddress;

      return {
        userAddresses: updatedAddresses,
        selectedAddress: newSelectedAddress
      };
    });

    // Also update in localStorage
    const state = get();
    localStorage.setItem('userAddresses', JSON.stringify(state.userAddresses));
    if (state.selectedAddress) {
      localStorage.setItem('selectedAddress', JSON.stringify(state.selectedAddress));
    }
  },

  removeAddress: (addressId) => {
    set(state => {
      const updatedAddresses = state.userAddresses.filter(addr => addr.id !== addressId);

      // If removing the selected address, clear the selection
      const newSelectedAddress = state.selectedAddress?.id === addressId
        ? null
        : state.selectedAddress;

      return {
        userAddresses: updatedAddresses,
        selectedAddress: newSelectedAddress
      };
    });

    // Also update in localStorage
    const state = get();
    localStorage.setItem('userAddresses', JSON.stringify(state.userAddresses));
    if (state.selectedAddress) {
      localStorage.setItem('selectedAddress', JSON.stringify(state.selectedAddress));
    } else {
      localStorage.removeItem('selectedAddress');
    }
  },

  saveDeliveryPreferences: () => {
    const { deliveryType, selectedAddress, selectedBranch, userAddresses, userBranches } = get();

    if (deliveryType) {
      localStorage.setItem('deliveryType', deliveryType);
    }

    if (selectedAddress) {
      localStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
    }

    if (selectedBranch) {
      localStorage.setItem('selectedBranch', JSON.stringify(selectedBranch));
    }

    if (userAddresses) {
      localStorage.setItem('userAddresses', JSON.stringify(userAddresses));
    }

    if (userBranches) {
      localStorage.setItem('userBranches', JSON.stringify(userBranches));
    }
  },

  updateAddressInStore: (addressId: number, updates: Partial<Address>) => {
    set((state) => ({
      userAddresses: state.userAddresses.map(addr =>
        addr.id === addressId ? { ...addr, ...updates } : addr
      )
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  loadDeliveryPreferences: async () => {
    try {
      set({ isLoading: true, error: null });

      // Сначала загружаем из localStorage для быстрого отображения
      const savedDeliveryType = localStorage.getItem('deliveryType');
      const savedSelectedAddress = localStorage.getItem('selectedAddress');
      const savedSelectedBranch = localStorage.getItem('selectedBranch');
      const savedUserAddresses = localStorage.getItem('userAddresses');
      const savedUserBranches = localStorage.getItem('userBranches');

      const updates: Partial<DeliveryState> = {};

      if (savedDeliveryType === 'delivery' || savedDeliveryType === 'pickup') {
        updates.deliveryType = savedDeliveryType;
      }

      if (savedSelectedAddress) {
        updates.selectedAddress = JSON.parse(savedSelectedAddress);
      }

      if (savedSelectedBranch) {
        updates.selectedBranch = JSON.parse(savedSelectedBranch);
      }

      if (savedUserAddresses) {
        updates.userAddresses = JSON.parse(savedUserAddresses);
      }

      if (savedUserBranches) {
        updates.userBranches = JSON.parse(savedUserBranches);
      }

      if (Object.keys(updates).length > 0) {
        set(updates);
      }

      // Затем загружаем с сервера для актуальных данных
      await get().loadPreferencesFromServer();

    } catch (error) {
      console.error('Error loading delivery preferences:', error);
      set({ error: 'Ошибка загрузки настроек доставки' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadPreferencesFromServer: async () => {
    try {
      set({ isLoading: true, error: null });

      // Загружаем данные пользователя с сервера
      const userResponse = await apiClient.getUser();

      if (userResponse.success && userResponse.data) {
        const user = userResponse.data;

        // Устанавливаем тип доставки из сервера
        const serverDeliveryType = user.delivery_type || 'delivery';
        set({ deliveryType: serverDeliveryType });

        // Обновляем localStorage
        localStorage.setItem('deliveryType', serverDeliveryType);

        // Если самовывоз и есть выбранный ресторан
        if (serverDeliveryType === 'pickup' && user.pickup_restaurant_info) {
          const restaurantInfo = user.pickup_restaurant_info;

          // Создаем branch объект на основе данных сервера
          const branch: Branch = {
            id: restaurantInfo.restaurant_id,
            name: restaurantInfo.name,
            address: restaurantInfo.address,
            city: '',
            phone: '',
            workTime: 'Ежедневно 10:00 - 23:00',
            restaurant: {
              id: restaurantInfo.restaurant_id,
              name: restaurantInfo.name
            },
            description: '',
            is_accepting_orders: true,
            is_active: true,
            delivery_fee: 0,
            free_delivery_threshold: 1000,
            min_order_amount: 0
          };

          set({ selectedBranch: branch });
          localStorage.setItem('selectedBranch', JSON.stringify(branch));
        }

        // Загружаем адреса с сервера
        const addressesResponse = await apiClient.getAddresses();
        if (addressesResponse.success && addressesResponse.data) {
          const serverAddresses = Array.isArray(addressesResponse.data)
            ? addressesResponse.data
            : addressesResponse.data.results || [];

          set({ userAddresses: serverAddresses });
          localStorage.setItem('userAddresses', JSON.stringify(serverAddresses));

          // Находим выбранный адрес (is_default или первый)
          const defaultAddress = serverAddresses.find((addr: Address) => addr.is_default) ||
                                 serverAddresses[0];
          if (defaultAddress) {
            set({ selectedAddress: defaultAddress });
            localStorage.setItem('selectedAddress', JSON.stringify(defaultAddress));
          }
        }
      }
    } catch (error) {
      console.error('Error loading preferences from server:', error);
      // Не устанавливаем ошибку, чтобы не блокировать работу приложения
    } finally {
      set({ isLoading: false });
    }
  },

  savePreferencesToServer: async () => {
    try {
      const state = get();

      if (!state.deliveryType) {
        return false;
      }

      const data: any = {
        delivery_type: state.deliveryType
      };

      // Если выбран самовывоз и есть выбранный ресторан
      if (state.deliveryType === 'pickup' && state.selectedBranch) {
        data.selected_restaurant_for_pickup = state.selectedBranch.restaurant?.id || state.selectedBranch.id;

        // Если есть branch_id (когда выбирается конкретный филиал)
        if (state.selectedBranch.id !== state.selectedBranch.restaurant?.id) {
          data.selected_branch_for_pickup = state.selectedBranch.id;
        }
      }

      const response = await apiClient.updateUser(data);
      return response.success;

    } catch (error) {
      console.error('Error saving preferences to server:', error);
      return false;
    }
  }
}));