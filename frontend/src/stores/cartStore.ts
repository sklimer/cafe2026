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

// Функция для расчета цены с учетом опций (объявляем в начале файла)
function calculateItemPrice(product: Product, options: SelectedOption[]): number {
  let price = Number(product.price);

  for (const option of options) {
    const optionDef = product.options?.find(opt => opt.id === option.optionId);
    if (optionDef) {
      const value = optionDef.values?.find(val => val.id === option.valueId);
      if (value) {
        price += Number(value.priceDelta || 0);
      }
    }
  }

  return price;
}

// Функции для работы с localStorage
const loadCartFromStorage = (): Partial<CartState> => {
  try {
    const stored = localStorage.getItem('cart');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Проверяем структуру данных
      if (parsed && Array.isArray(parsed.items)) {
        return {
          items: parsed.items || [],
          restaurantId: parsed.restaurantId || null,
          subtotal: parsed.subtotal || 0
        };
      }
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
  }
  return {};
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

const initialState = {
  items: [] as CartItem[],
  restaurantId: null as string | null,
  subtotal: 0,
  ...loadCartFromStorage()
};

export const useCartStore = create<CartState>((set, get) => ({
  ...initialState,

  addItem: (product, quantity, options) => set((state) => {
    // Проверяем, совпадает ли ресторан
    if (state.restaurantId && state.restaurantId !== product.restaurantId) {
      // Если нет, очищаем корзину перед добавлением
      const newItem: CartItem = {
        id: `${product.id}_${Date.now()}`,
        productId: product.id,
        product,
        quantity,
        selectedOptions: options,
        price: calculateItemPrice(product, options)
      };
      
      const newState = {
        ...state,
        items: [newItem],
        restaurantId: product.restaurantId,
        subtotal: calculateItemPrice(product, options) * quantity
      };
      saveCartToStorage(newState);
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
        price: calculateItemPrice(product, options)
      });
    }

    const newState = {
      ...state,
      items: newItems,
      restaurantId: state.restaurantId || product.restaurantId,
      subtotal: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    saveCartToStorage(newState);
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
    saveCartToStorage(newState);
    return newState;
  }),

  removeItem: (itemId) => set((state) => {
    const newState = get().removeItemFromState(state, itemId);
    saveCartToStorage(newState);
    return newState;
  }),

  clearCart: () => {
    const newState = { items: [], restaurantId: null, subtotal: 0 };
    saveCartToStorage(newState);
    set(newState);
  },

  // Computed properties
  totalItems: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  itemCount: (productId: string) => {
    const state = get();
    return state.items
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  },

  isSameRestaurant: (restaurantId: string) => {
    const state = get();
    return state.restaurantId === restaurantId;
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
}));