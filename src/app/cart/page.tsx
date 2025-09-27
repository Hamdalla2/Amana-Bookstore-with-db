// src/app/cart/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CartItem from '../components/CartItem';
import { fetchCart, updateCartItem, removeFromCart, fetchBook } from '@/lib/api';
import { Book, CartItem as CartItemType } from '../types';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<{ book: Book; quantity: number; cartItem: CartItemType }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cartData = await fetchCart('guest');
      const itemsWithBooks = await Promise.all(
        cartData.cartItems.map(async (cartItem: CartItemType) => {
          try {
            const book = await fetchBook(cartItem.bookId);
            return { book, quantity: cartItem.quantity, cartItem };
          } catch (err) {
            console.error(`Failed to load book ${cartItem.bookId}:`, err);
            return null;
          }
        })
      );
      
      const validItems = itemsWithBooks.filter((item): item is { book: Book; quantity: number; cartItem: CartItemType } => item !== null);
      setCartItems(validItems);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError('Failed to load cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (bookId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const cartItem = cartItems.find(item => item.book.id === bookId);
      if (!cartItem) return;

      await updateCartItem(cartItem.cartItem.id, newQuantity);
      
      // Update local state
      setCartItems(prev => 
        prev.map(item => 
          item.book.id === bookId ? { ...item, quantity: newQuantity } : item
        )
      );
      
      // Dispatch cart update event for navbar
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) {
      console.error('Failed to update quantity:', err);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const removeItem = async (bookId: string) => {
    try {
      const cartItem = cartItems.find(item => item.book.id === bookId);
      if (!cartItem) return;

      await removeFromCart(cartItem.cartItem.id, 'guest');
      
      // Update local state
      setCartItems(prev => prev.filter(item => item.book.id !== bookId));
      
      // Dispatch cart update event for navbar
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert('Failed to remove item. Please try again.');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.book.price * item.quantity), 0);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center bg-red-100 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadCart}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some books to get started!</p>
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <CartItem
              key={item.book.id}
              item={{ book: item.book, quantity: item.quantity }}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span>Subtotal ({cartItems.length} items):</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${(calculateTotal() * 0.08).toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${(calculateTotal() * 1.08).toFixed(2)}</span>
            </div>
          </div>

          <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 mb-4">
            Proceed to Checkout
          </button>
          
          <Link 
            href="/"
            className="block w-full text-center bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
