/**
 * Wishlist Page
 * Shows customer's saved products
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { IProduct } from '@/types';

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [wishlistItems, setWishlistItems] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not customer
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'customer') {
      router.push('/login');
    }
  }, [session, status, router]);

  // Load wishlist from localStorage and fetch product details
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (wishlist.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch product details for wishlist items
        const productPromises = wishlist.map(async (productId: string) => {
          try {
            const response = await fetch(`/api/products/${productId}`);
            const data = await response.json();
            if (data.success) {
              return data.data;
            }
            return null;
          } catch (error) {
            console.error('Error fetching product:', error);
            return null;
          }
        });

        const products = await Promise.all(productPromises);
        const validProducts = products.filter(Boolean);
        setWishlistItems(validProducts);
      } catch (error) {
        console.error('Error loading wishlist:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  // Remove from wishlist
  const removeFromWishlist = (productId: string) => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const updatedWishlist = wishlist.filter((id: string) => id !== productId);
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      
      setWishlistItems(prev => prev.filter(item => item._id!.toString() !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  // Add to cart
  const addToCart = (product: IProduct) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find((item: any) => item.productId === product._id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          productId: product._id,
          name: product.name,
          image: product.image,
          pricePerDay: product.pricePerDay,
          quantity: 1,
          duration: 'day',
          fromDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          toDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
          pricePerUnit: product.pricePerDay,
          totalPrice: product.pricePerDay,
          endUserId: product.endUserId?.toString() // Include endUserId for order tracking
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      toast.success('Added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600">Save your favorite items for later</p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-6">Start browsing and add items you love to your wishlist</p>
            <Link 
              href="/shop"
              className="bg-primary-800 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((product) => (
              <div key={product._id!.toString()} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
                {/* Product Image */}
                <div className="relative w-full h-48">
                  <Link href={`/shop/product/${product._id}`}>
                    <Image
                      src={product.image || defaultImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(product._id!.toString())}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <Link href={`/shop/product/${product._id}`}>
                    <h3 className="font-semibold text-gray-900 mb-1 hover:text-primary-800 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-primary-800 font-bold text-lg mb-2">
                    ₹{product.pricePerDay}/day
                  </p>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {product.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 bg-primary-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
