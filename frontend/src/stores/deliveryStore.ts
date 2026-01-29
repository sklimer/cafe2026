
import { create } from 'zustand';
import { Address, Branch } from '../types';

interface DeliveryState {
  deliveryType: 'delivery' | 'pickup' | null;
  selectedAddress: Address | null;
  selectedBranch: Branch | null;
  userAddresses: Address[];
  userBranches: Branch[];

  // Actions
  setDeliveryType: (type: 'delivery' | 'pickup') => void;
  setSelectedAddress: (address: Address | null) => void;
  setSelectedBranch: (branch: Branch | null) => void;
  setUserAddresses: (addresses: Address[]) => void;
  setUserBranches: (branches: Branch[]) => void;
  setDefaultAddress: (addressId: string) => void;
  addNewAddress: (address: Address) => void;
  updateAddress: (address: Address) => void;
  removeAddress: (addressId: string) => void;
  saveDeliveryPreferences: () => void;
  loadDeliveryPreferences: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  deliveryType: null,
  selectedAddress: null,
  selectedBranch: null,
  userAddresses: [],
  userBranches: [],

  setDeliveryType: (type) => {
    set({ deliveryType: type });
    // Save to localStorage
    localStorage.setItem('deliveryType', type);
  },

  setSelectedAddress: (address) => {
    set({ selectedAddress: address });
    if (address) {
      localStorage.setItem('selectedAddress', JSON.stringify(address));
    } else {
      localStorage.removeItem('selectedAddress');
    }
  },

  setSelectedBranch: (branch) => {
    set({ selectedBranch: branch });
    if (branch) {
      localStorage.setItem('selectedBranch', JSON.stringify(branch));
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
        isDefault: address.id === addressId
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
        isDefault: isFirstAddress
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

  loadDeliveryPreferences: () => {
    try {
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
    } catch (error) {
      console.error('Error loading delivery preferences:', error);
    }
  }
}));