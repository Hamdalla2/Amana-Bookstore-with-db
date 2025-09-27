// src/lib/api.ts
import { Book, Review, CartItem } from '@/app/types';

const API_BASE = '/api';

// Books API
export async function fetchBooks(params?: {
  genre?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  const searchParams = new URLSearchParams();
  
  if (params?.genre) searchParams.set('genre', params.genre);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.featured) searchParams.set('featured', 'true');
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(`${API_BASE}/books?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

export async function fetchBook(id: string): Promise<Book> {
  const response = await fetch(`${API_BASE}/books/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch book');
  }
  return response.json();
}

// Reviews API
export async function fetchReviews(params?: {
  bookId?: string;
  rating?: number;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params?.bookId) searchParams.set('bookId', params.bookId);
  if (params?.rating) searchParams.set('rating', params.rating.toString());
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(`${API_BASE}/reviews?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return response.json();
}

export async function addReview(review: Omit<Review, 'id' | 'timestamp' | 'verified'>) {
  const response = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(review),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add review');
  }
  return response.json();
}

// Cart API
export async function fetchCart(userId: string = 'guest') {
  const response = await fetch(`${API_BASE}/cart?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }
  return response.json();
}

export async function addToCart(item: {
  bookId: string;
  quantity: number;
  userId?: string;
}) {
  const response = await fetch(`${API_BASE}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...item, userId: item.userId || 'guest' }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add item to cart');
  }
  return response.json();
}

export async function updateCartItem(itemId: string, quantity: number) {
  const response = await fetch(`${API_BASE}/cart`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: itemId, quantity }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update cart item');
  }
  return response.json();
}

export async function removeFromCart(itemId: string, userId: string = 'guest') {
  const response = await fetch(`${API_BASE}/cart?itemId=${itemId}&userId=${userId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove item from cart');
  }
  return response.json();
}
