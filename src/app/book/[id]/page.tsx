// src/app/book/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchBook, fetchReviews, addToCart } from "@/lib/api";
import { Book, Review } from "../../types";

export default function BookDetailPage() {
  const [book, setBook] = useState<Book | null>(null);
  const [bookReviews, setBookReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const params = useParams();
  const { id } = params;

  useEffect(() => {
    async function loadBookData() {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load book and reviews in parallel
        const [bookData, reviewsData] = await Promise.all([
          fetchBook(id as string),
          fetchReviews({ bookId: id as string, limit: 50 }),
        ]);

        setBook(bookData);
        setBookReviews(reviewsData.reviews);
      } catch (err) {
        console.error("Error loading book data:", err);
        setError("Failed to load book details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBookData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!book) return;

    try {
      setIsAddingToCart(true);

      const cartItem = {
        bookId: book.id,
        quantity: quantity,
        userId: "guest", // In a real app, this would come from user session
      };

      await addToCart(cartItem);

      // Show success message
      alert(
        `Added ${quantity} ${quantity === 1 ? "copy" : "copies"} of "${
          book.title
        }" to cart!`,
      );

      // Dispatch cart update event for navbar
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Failed to add item to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center bg-red-100 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-red-800 mb-2">
            Book Not Found
          </h2>
          <p className="text-red-600">
            {error || "The book you are looking for does not exist."}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Books
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Book Image (forced placeholder) */}
        <div className="space-y-4">
          <Image
            src="/window.svg"
            alt={book.title}
            width={800}
            height={600}
            className="w-full h-96 object-cover rounded-lg shadow-lg"
            priority
          />
        </div>

        {/* Book Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {book.title}
            </h1>
            <p className="text-xl text-gray-600 mb-4">by {book.author}</p>

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < Math.floor(book.rating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-600">
                ({book.rating}) • {book.reviewCount} reviews
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-green-600 mb-6">
              ${book.price}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {book.description}
              </p>
            </div>

            {/* Book Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="font-semibold">ISBN:</span> {book.isbn}
              </div>
              <div>
                <span className="font-semibold">Pages:</span> {book.pages}
              </div>
              <div>
                <span className="font-semibold">Language:</span> {book.language}
              </div>
              <div>
                <span className="font-semibold">Publisher:</span>{" "}
                {book.publisher}
              </div>
              <div>
                <span className="font-semibold">Published:</span>{" "}
                {new Date(book.datePublished).toLocaleDateString()}
              </div>
              <div>
                <span className="font-semibold">In Stock:</span>{" "}
                {book.inStock ? "Yes" : "No"}
              </div>
            </div>

            {/* Genres */}
            <div className="mb-6">
              <span className="font-semibold">Genres:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {book.genre.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Add to Cart */}
            {book.inStock && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label htmlFor="quantity" className="font-semibold">
                    Quantity:
                  </label>
                  <select
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-1"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingToCart ? "Adding to Cart..." : "Add to Cart"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {bookReviews.length === 0 ? (
          <p className="text-gray-600">
            No reviews yet. Be the first to review this book!
          </p>
        ) : (
          <div className="space-y-6">
            {bookReviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{review.author}</span>
                    {review.verified && (
                      <span className="text-green-600 text-sm">✓ Verified</span>
                    )}
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < review.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
                <p className="text-gray-700 mb-3">{review.comment}</p>
                <p className="text-sm text-gray-500">
                  {new Date(review.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
