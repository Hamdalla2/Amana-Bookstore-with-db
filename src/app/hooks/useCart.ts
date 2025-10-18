// src/app/hooks/useCart.ts
'use client';

import { useState, useEffect } from 'react';
import { fetchCart } from '@/lib/api';

export interface CartItem {
  id: string;
  bookId: string;
  quantity: number;
  addedAt: string;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const cartData = await fetchCart('guest');
      setCartItems(cartData.cartItems || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isInCart = (bookId: string): boolean => {
    return cartItems.some(item => item.bookId === bookId);
  };

  const getCartItemCount = (): number => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  useEffect(() => {
    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  return {
    cartItems,
    isLoading,
    isInCart,
    getCartItemCount,
    refreshCart: loadCart
  };
};
