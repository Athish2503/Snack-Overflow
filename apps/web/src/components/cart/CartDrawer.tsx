'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  PackageOpen,
} from 'lucide-react';
import { CategoryIcon } from '../../lib/snackHelpers';
import { toast } from 'sonner';
import { fireSuperConfetti, FUNNY_CHECKOUT_QUIPS, getRandomQuip } from '@/lib/confetti';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalCalories,
  } = useCart();

  const queryClient = useQueryClient();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<Array<{ name: string; amountConsumed: number; calories?: number | null }> | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const handleClose = () => {
    setCheckoutError(null);
    closeCart();
  };

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const itemsPayload = cart.map((item) => ({
        snackId: item.snack.id,
        amount: item.quantity,
      }));

      const res = await api.post<{
        data: Array<{
          id: string;
          name: string;
          amountConsumed: number;
          calories?: number | null;
        }>;
        message: string;
      }>('/snacks/checkout', { items: itemsPayload });

      // Invalidate queries so dashboard, cards, and activity log update instantly
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });

      // Save success summary and empty cart
      const receipt = cart.map((c) => ({
        name: c.snack.name,
        amountConsumed: c.quantity,
        calories: c.snack.calories,
      }));
      setCheckoutSuccess(receipt);
      clearCart();

      // Launch celebratory confetti & funny toast
      fireSuperConfetti();
      const funnyQuip = getRandomQuip(FUNNY_CHECKOUT_QUIPS);
      toast.success(res.message || 'Haul secured! Snacks packed & consumed.', {
        description: funnyQuip,
        duration: 4500,
      });
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      const errMsg = apiErr.message || 'Failed to checkout. Please check available stock.';
      setCheckoutError(errMsg);
      toast.error(errMsg);
      // Refresh inventory queries to reflect any changed stock
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCloseSuccess = () => {
    setCheckoutSuccess(null);
    closeCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        className="relative z-10 w-full max-w-md bg-[var(--surface)] border-l-2 border-[var(--ink)] shadow-[-6px_0_0_var(--ink)] flex flex-col h-full max-h-screen text-[var(--ink)] transition-transform duration-300 animate-in slide-in-from-right"
        role="dialog"
        aria-modal="true"
        aria-label="Snack Cart"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[var(--ink)] bg-[var(--surface-2)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] flex items-center justify-center">
              <ShoppingBag size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="font-heading font-black text-lg text-[var(--ink)] tracking-tight">
                Pantry Bag
              </h2>
              <p className="text-xs font-medium text-[var(--ink-muted)]">
                {totalItems} {totalItems === 1 ? 'snack' : 'snacks'} selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && !checkoutSuccess && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--gone)] px-2 py-1 rounded transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close cart"
              className="w-9 h-9 rounded-xl bg-[var(--surface)] text-[var(--ink)] border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] flex items-center justify-center hover:bg-[var(--primary-soft)] active:scale-90 transition-all"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {checkoutSuccess ? (
            /* Checkout Success State */
            <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--stocked-soft)] text-[var(--stocked)] border-2 border-[var(--ink)] shadow-[4px_4px_0_var(--ink)] flex items-center justify-center animate-bounce">
                <Sparkles size={32} strokeWidth={2.5} />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-[var(--stocked-soft)] text-[var(--stocked-ink)] text-xs font-extrabold uppercase tracking-wider border border-[var(--stocked)] mb-2">
                  Snack Run Complete
                </span>
                <h3 className="text-2xl font-black font-heading text-[var(--ink)]">
                  Fuel Secured!
                </h3>
                <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-xs">
                  Your snacks have been claimed. Go crush those bugs!
                </p>
              </div>

              {/* Receipt Summary */}
              <div className="w-full bg-[var(--surface-2)] rounded-xl border-2 border-[var(--ink)] p-4 text-left space-y-2 mt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] border-b border-[var(--ink)]/20 pb-1">
                  Snacks Claimed:
                </div>
                {checkoutSuccess.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm font-bold">
                    <span className="truncate pr-2">{item.name}</span>
                    <span className="shrink-0 text-[var(--primary)]">
                      x{item.amountConsumed}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCloseSuccess}
                className="w-full mt-4 py-3 px-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider bg-[var(--primary)] text-white border-2 border-[var(--ink)] shadow-[3px_3px_0_var(--ink)] hover:shadow-[5px_5px_0_var(--ink)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_var(--ink)] transition-all flex items-center justify-center gap-2"
              >
                <span>Back to Pantry</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          ) : cart.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] text-[var(--ink-muted)] border-2 border-[var(--ink)] shadow-[3px_3px_0_var(--ink)] flex items-center justify-center">
                <PackageOpen size={30} strokeWidth={2} />
              </div>
              <h3 className="font-heading font-black text-lg text-[var(--ink)]">
                Your bag is empty
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-xs leading-relaxed">
                Add your favorite pantry items to enjoy an energizing coding break!
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 px-4 py-2 rounded-xl font-heading font-black text-xs uppercase tracking-wider bg-[var(--primary-soft)] text-[var(--primary)] border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] hover:bg-[var(--primary)] hover:text-white transition-all"
              >
                Browse Snacks
              </button>
            </div>
          ) : (
            /* Cart Items List */
            <>
              {checkoutError && (
                <div className="p-3 rounded-xl bg-[var(--gone-soft)] border-2 border-[var(--gone)] text-[var(--gone-ink)] text-xs font-bold flex items-start gap-2 animate-shake">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {cart.map(({ snack, quantity }) => {
                const primaryImg = (snack.images && snack.images.length > 0) ? snack.images[0] : snack.imageUrl;
                const isMax = quantity >= snack.quantity;
                const lineKcal = (snack.calories || 0) * quantity;

                return (
                  <div
                    key={snack.id}
                    className="p-3 rounded-xl bg-[var(--surface)] border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] flex items-center gap-3 transition-transform hover:translate-x-0.5"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-14 h-14 rounded-lg border-2 border-[var(--ink)] overflow-hidden shrink-0 bg-[var(--surface-2)] flex items-center justify-center">
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={snack.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <CategoryIcon category={snack.category} size={24} className="text-[var(--ink-muted)]" />
                      )}
                    </div>

                    {/* Snack Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-heading font-black text-sm text-[var(--ink)] truncate">
                          {snack.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(snack.id)}
                          aria-label={`Remove ${snack.name} from cart`}
                          className="text-[var(--ink-muted)] hover:text-[var(--gone)] p-1 rounded transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Calories & Stock Pill */}
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        {snack.calories !== null && snack.calories !== undefined && (
                          <span className="flex items-center gap-0.5 text-[var(--primary)] font-bold">
                            <Flame size={12} />
                            {lineKcal} kcal
                          </span>
                        )}
                        <span className="text-[var(--ink-muted)] text-[11px]">
                          ({snack.quantity} in pantry)
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 bg-[var(--surface-2)] rounded-lg border border-[var(--ink)] p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(snack.id, quantity - 1)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded bg-[var(--surface)] border border-[var(--ink)] flex items-center justify-center text-[var(--ink)] hover:bg-[var(--primary-soft)] active:scale-90 transition-all"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="w-6 text-center text-xs font-black font-heading text-[var(--ink)]">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(snack.id, quantity + 1)}
                            disabled={isMax}
                            aria-label="Increase quantity"
                            className={`w-6 h-6 rounded bg-[var(--surface)] border border-[var(--ink)] flex items-center justify-center text-[var(--ink)] transition-all ${
                              isMax
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-[var(--primary-soft)] active:scale-90'
                            }`}
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>

                        {isMax && (
                          <span className="text-[10px] font-bold text-[var(--running-low-ink)] bg-[var(--running-low-soft)] px-1.5 py-0.5 rounded border border-[var(--running-low)]">
                            Max available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer / Summary & Checkout Button */}
        {cart.length > 0 && !checkoutSuccess && (
          <div className="p-4 sm:p-5 border-t-2 border-[var(--ink)] bg-[var(--surface-2)] space-y-3">
            <div className="space-y-1.5 text-xs font-bold text-[var(--ink-muted)]">
              <div className="flex justify-between items-center">
                <span>Total Items:</span>
                <span className="text-[var(--ink)] font-heading font-black text-sm">
                  {totalItems} {totalItems === 1 ? 'snack' : 'snacks'}
                </span>
              </div>
              {totalCalories > 0 && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Flame size={14} className="text-[var(--primary)]" />
                    Total Energy:
                  </span>
                  <span className="text-[var(--primary)] font-heading font-black text-sm">
                    {totalCalories} kcal
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut || totalItems === 0}
              className="w-full py-3.5 px-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider bg-[var(--primary)] text-white border-2 border-[var(--ink)] shadow-[4px_4px_0_var(--ink)] hover:shadow-[6px_6px_0_var(--ink)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_var(--ink)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Packing snacks...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} strokeWidth={2.5} />
                  <span>Grab them all ({totalItems})</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
