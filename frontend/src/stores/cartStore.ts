
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
  totalItems: number;
  itemCount: (productId: string) => number;
  isSameRestaurant: (restaurantId: string) => boolean;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,
  subtotal: 0,

  addItem: (product, quantity, options) => set((state) => {
    // Проверяем, совпадает ли ресторан
    if (state.restaurantId && state.restaurantId !== product.restaurantId) {
      // Если нет, очищаем корзину перед добавлением
      return {
        ...state,
        items: [{
          id: `${product.id}_${Date.now()}`,
          productId: product.id,
          product,
          quantity,
          selectedOptions: options,
          price: calculateItemPrice(product, options)
        }],
        restaurantId: product.restaurantId,
        subtotal: calculateItemPrice(product, options) * quantity
      };
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

    return {
      ...state,
      items: newItems,
      restaurantId: state.restaurantId || product.restaurantId,
      subtotal: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
  }),

  updateQuantity: (itemId, quantity) => set((state) => {
    if (quantity <= 0) {
      return get().removeItemFromState(state, itemId);
    }

    const updatedItems = state.items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );

    return {
      ...state,
      items: updatedItems,
      subtotal: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
  }),

  removeItem: (itemId) => set((state) => get().removeItemFromState(state, itemId)),

  clearCart: () => set({ items: [], restaurantId: null, subtotal: 0 }),

  // Computed properties
  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  itemCount: (productId: string) => {
    return this.items
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  },

  isSameRestaurant: (restaurantId: string) => {
    return this.restaurantId === restaurantId;
  },

  // Вспомогательная функция для удаления элемента
  removeItemFromState: (state, itemId) => {
    const filteredItems = state.items.filter(item => item.id !== itemId);
    return {
      ...state,
      items: filteredItems,
      subtotal: filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
  }
}));

// Вспомогательная функция для расчета цены с учетом опций
function calculateItemPrice(product: Product, options: SelectedOption[]): number {
  let price = product.price;

  for (const option of options) {
    const optionDef = product.options.find(opt => opt.id === option.optionId);
    if (optionDef) {
      const value = optionDef.values.find(val => val.id === option.valueId);
      if (value) {
        price += value.priceDelta;
      }
    }
  }

  return price;
}