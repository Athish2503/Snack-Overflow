'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Snack, CartItem } from '../lib/types';

export interface FlyingItem {
  id: string;
  imageUrl?: string | null;
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

const CART_STORAGE_KEY = 'snackoverflow_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
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
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isBouncing, setIsBouncing] = useState(false);
  const cartTargetRef = useRef<HTMLElement | null>(null);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore localStorage errors
    }
  }, [cart]);

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
        const targetRect = cartTargetRef.current.getBoundingClientRect();
        const flyingId = `${snack.id}-${Date.now()}-${Math.random()}`;
        const primaryImg = (snack.images && snack.images.length > 0) ? snack.images[0] : snack.imageUrl;

        const newFlyer: FlyingItem = {
          id: flyingId,
          imageUrl: primaryImg,
          name: snack.name,
          startX: sourceRect.left + sourceRect.width / 2,
          startY: sourceRect.top + sourceRect.height / 2,
          startWidth: Math.min(sourceRect.width, 96),
          startHeight: Math.min(sourceRect.height, 96),
          targetX: targetRect.left + targetRect.width / 2,
          targetY: targetRect.top + targetRect.height / 2,
        };

        setFlyingItems((prev) => [...prev, newFlyer]);

        // Remove after animation duration & bounce cart
        setTimeout(() => {
          setFlyingItems((prev) => prev.filter((f) => f.id !== flyingId));
          triggerBounce();
        }, 580);
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
