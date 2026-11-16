'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Snack, CartItem, SnackCategory } from '../lib/types';
import { useAuth } from './AuthContext';

export interface FlyingItem {
  id: string;
  imageUrl?: string | null;
  category?: SnackCategory;
  name: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  targetX: number;
  targetY: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (snack: Snack, quantity?: number, sourceRect?: DOMRect | null) => boolean;
  updateQuantity: (snackId: string, quantity: number) => void;
  removeFromCart: (snackId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalCalories: number;
  getItemQuantity: (snackId: string) => number;
  flyingItems: FlyingItem[];
  registerCartTarget: (element: HTMLElement | null) => void;
  isBouncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getCartStorageKey(userId?: string | null): string {
  return userId ? `snackoverflow_cart_${userId}` : 'snackoverflow_cart_guest';
}

function loadUserCart(userId?: string | null): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getCartStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return [];
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [cart, setCart] = useState<CartItem[]>(() => {
    return loadUserCart(userId);
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isBouncing, setIsBouncing] = useState(false);
  const cartTargetRef = useRef<HTMLElement | null>(null);

  // Track which user's cart is currently in state
  const lastLoadedUserIdRef = useRef<string | null>(userId);

  // Clean up any legacy shared cart key
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('snackoverflow_cart_v1');
      } catch {
        // Ignore localStorage errors
      }
    }
  }, []);

  // Sync cart whenever the logged-in user changes (or upon initial session restore)
  useEffect(() => {
    if (lastLoadedUserIdRef.current !== userId) {
      setCart(loadUserCart(userId));
      lastLoadedUserIdRef.current = userId;
    }
  }, [userId]);

  // Save cart to user-scoped localStorage key
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Guard: do not save the old user's cart to the new user's storage key before loading
    if (lastLoadedUserIdRef.current !== userId) return;

    try {
      const key = getCartStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(cart));
    } catch {
      // Ignore localStorage errors
    }
  }, [cart, userId]);

  const registerCartTarget = useCallback((element: HTMLElement | null) => {
    cartTargetRef.current = element;
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const getItemQuantity = useCallback(
    (snackId: string) => {
      const item = cart.find((i) => i.snack.id === snackId);
      return item ? item.quantity : 0;
    },
    [cart]
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCalories = cart.reduce((sum, item) => {
    const unitKcal = item.snack.calories || 0;
    return sum + unitKcal * item.quantity;
  }, 0);

  const triggerBounce = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => {
      setIsBouncing(false);
    }, 450);
  }, []);

  const addToCart = useCallback(
    (snack: Snack, quantityToAdd = 1, sourceRect?: DOMRect | null) => {
      const currentQty = getItemQuantity(snack.id);
      const maxAvailable = snack.quantity;

      if (maxAvailable <= 0) {
        return false;
      }

      if (currentQty + quantityToAdd > maxAvailable) {
        return false;
      }

      // Trigger flying animation if sourceRect and cart target exist
      if (sourceRect && cartTargetRef.current) {
        // Reduced motion check
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
          triggerBounce();
        } else {
          // Measure targetRect at click time using viewport coordinates
          const targetRect = cartTargetRef.current.getBoundingClientRect();
          const flyingId = `${snack.id}-${Date.now()}-${Math.random()}`;
          const primaryImg = (snack.images && snack.images.length > 0) ? snack.images[0] : snack.imageUrl;

          const newFlyer: FlyingItem = {
            id: flyingId,
            imageUrl: primaryImg,
            category: snack.category,
            name: snack.name,
            startX: sourceRect.left + sourceRect.width / 2,
            startY: sourceRect.top + sourceRect.height / 2,
            startWidth: 56,
            startHeight: 56,
            targetX: targetRect.left + targetRect.width / 2,
            targetY: targetRect.top + targetRect.height / 2,
          };

          setFlyingItems((prev) => [...prev, newFlyer]);

          // Remove after animation duration (~600ms) & trigger bounce on bag
          setTimeout(() => {
            setFlyingItems((prev) => prev.filter((f) => f.id !== flyingId));
            triggerBounce();
          }, 600);
        }
      } else {
        triggerBounce();
      }

      setCart((prev) => {
        const existingIndex = prev.findIndex((i) => i.snack.id === snack.id);
        if (existingIndex > -1) {
          const updated = [...prev];
          const newQty = updated[existingIndex].quantity + quantityToAdd;
          updated[existingIndex] = {
            ...updated[existingIndex],
            snack, // refresh snack metadata
            quantity: Math.min(newQty, maxAvailable),
          };
          return updated;
        } else {
          return [...prev, { snack, quantity: quantityToAdd }];
        }
      });

      return true;
    },
    [getItemQuantity, triggerBounce]
  );

  const updateQuantity = useCallback((snackId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.snack.id !== snackId));
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.snack.id === snackId) {
          const maxAvailable = item.snack.quantity;
          return {
            ...item,
            quantity: Math.min(quantity, maxAvailable),
          };
        }
        return item;
      })
    );
  }, []);

  const removeFromCart = useCallback((snackId: string) => {
    setCart((prev) => prev.filter((i) => i.snack.id !== snackId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        totalItems,
        totalCalories,
        getItemQuantity,
        flyingItems,
        registerCartTarget,
        isBouncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
