
import { create } from 'zustand';
import type { Product, CartItem, SelectedOption } from '../types/index';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  subtotal: number;

  // Actions
  addItem: (product: Product, quantity: number, options: SelectedOption[]) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  // Getters
  totalItems: () => number;
  itemCount: (productId: string) => number;
  isSameRestaurant: (restaurantId: string) => boolean;

  // Helper function
  removeItemFromState: (state: CartState, itemId: string) => CartState;
}

// Функции для работы с localStorage
const loadCartFromStorage = (): CartState | null => {
  try {
    const stored = localStorage.getItem('cart');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
  }
  return null;
};

const saveCartToStorage = (state: CartState) => {
  try {
    localStorage.setItem('cart', JSON.stringify({
      items: state.items,
      restaurantId: state.restaurantId,
      subtotal: state.subtotal
    }));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

const initialState = loadCartFromStorage() || {
  items: [],
  restaurantId: null,
  subtotal: 0,
};

export const useCartStore = create<CartState>((set, get) => ({
  ...initialState,

  addItem: (product, quantity, options) => set((state) => {
    // Проверяем, совпадает ли ресторан
    if (state.restaurantId && state.restaurantId !== product.restaurantId) {
      // Если нет, очищаем корзину перед добавлением
      const newState = {
        ...state,
        items: [{
          id: `${product.id}_${Date.now()}`,
          productId: product.id,
          product,
          quantity,
          selectedOptions: options,
          price: Number(calculateItemPrice(product, options))
        }],
        restaurantId: product.restaurantId,
        subtotal: Number(calculateItemPrice(product, options)) * quantity
      };
      saveCartToStorage(newState); // Сохраняем в localStorage
      return newState;
    }

    // Проверяем, есть ли уже такой товар с такими же опциями
    const existingItemIndex = state.items.findIndex(item =>
      item.productId === product.id &&
      JSON.stringify(item.selectedOptions.map(o => o.valueId).sort()) ===
      JSON.stringify(options.map(o => o.valueId).sort())
    );

    let newItems = [...state.items];
    if (existingItemIndex >= 0) {
      // Обновляем количество существующего элемента
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + quantity
      };
    } else {
      // Добавляем новый элемент
      newItems.push({
        id: `${product.id}_${Date.now()}`,
        productId: product.id,
        product,
        quantity,
        selectedOptions: options,
        price: Number(calculateItemPrice(product, options))
      });
    }

    const newState = {
      ...state,
      items: newItems,
      restaurantId: state.restaurantId || product.restaurantId,
      subtotal: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    saveCartToStorage(newState); // Сохраняем в localStorage
    return newState;
  }),

  updateQuantity: (itemId, quantity) => set((state) => {
    if (quantity <= 0) {
      return get().removeItemFromState(state, itemId);
    }

    const updatedItems = state.items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );

    const newState = {
      ...state,
      items: updatedItems,
      subtotal: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    saveCartToStorage(newState); // Сохраняем в localStorage
    return newState;
  }),

  removeItem: (itemId) => set((state) => {
    const newState = get().removeItemFromState(state, itemId);
    saveCartToStorage(newState); // Сохраняем в localStorage
    return newState;
  }),

  clearCart: () => {
    const newState = { items: [], restaurantId: null, subtotal: 0 };
    saveCartToStorage(newState); // Сохраняем в localStorage
    set(newState);
  },

  // Computed properties
  totalItems: 0, // Will be calculated dynamically in the getter below

  itemCount: (productId: string) => 0, // Will be calculated dynamically in the getter below

  isSameRestaurant: (restaurantId: string) => {
    return this.restaurantId === restaurantId;
  },

  // Вспомогательная функция для удаления элемента
  removeItemFromState: (state, itemId) => {
    const filteredItems = state.items.filter(item => item.id !== itemId);
    const newState = {
      ...state,
      items: filteredItems,
      subtotal: filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    return newState;
  }
}), (set, get) => ({
  // Computed getters
  totalItems: () => {
    const state = get();
    return state.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  },

  itemCount: (productId: string) => {
    const state = get();
    return state.items?.filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }
}));

// Вспомогательная функция для расчета цены с учетом опций
function calculateItemPrice(product: Product, options: SelectedOption[]): number {
  let price = Number(product.price);

  for (const option of options) {
    const optionDef = product.options.find(opt => opt.id === option.optionId);
    if (optionDef) {
      const value = optionDef.values.find(val => val.id === option.valueId);
      if (value) {
        price += Number(value.priceDelta);
      }
    }
  }

  return price;
}