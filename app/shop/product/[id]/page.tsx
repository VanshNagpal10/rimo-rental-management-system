/**
 * Product Detail Page
 * Shows detailed product information with booking functionality
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { 
  Heart, 
  ShoppingCart, 
  Calendar, 
  Plus, 
  Minus, 
  Share2,
  ChevronRight,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { IProduct } from '@/types';

interface ProductDetailPageProps {
  params: { id: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState<'hour' | 'day' | 'week' | 'month' | 'year'>('day');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Redirect if not customer
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'customer') {
      router.push('/login');
    }
  }, [session, status, router]);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${params.id}`);
        const data = await response.json();
        
        if (data.success) {
          setProduct(data.data);
        } else {
          toast.error('Product not found');
          router.push('/shop');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
        router.push('/shop');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

  // Calculate total price based on duration and dates
  useEffect(() => {
    if (!product || !fromDate || !toDate) {
      setTotalPrice(0);
      return;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let pricePerUnit = 0;
    let units = 1;

    switch (selectedDuration) {
      case 'hour':
        pricePerUnit = product.pricePerHour || 0;
        units = diffDays * 24; // Convert days to hours
        break;
      case 'day':
        pricePerUnit = product.pricePerDay || 0;
        units = diffDays;
        break;
      case 'week':
        pricePerUnit = product.pricePerWeek || 0;
        units = Math.ceil(diffDays / 7);
        break;
      case 'month':
        pricePerUnit = product.pricePerMonth || 0;
        units = Math.ceil(diffDays / 30);
        break;
      case 'year':
        pricePerUnit = product.pricePerYear || 0;
        units = Math.ceil(diffDays / 365);
        break;
    }

    const total = pricePerUnit * units * quantity;
    setTotalPrice(total);
  }, [product, fromDate, toDate, selectedDuration, quantity]);

  // Add to cart function
  const addToCart = async () => {
    if (!product) return;
    
    if (!fromDate || !toDate) {
      toast.error('Please select rental dates');
      return;
    }

    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const cartItem = {
        productId: product._id,
        name: product.name,
        image: product.image,
        quantity,
        duration: selectedDuration,
        fromDate,
        toDate,
        pricePerUnit: product[`pricePer${selectedDuration.charAt(0).toUpperCase() + selectedDuration.slice(1)}` as keyof IProduct] as number,
        totalPrice,
        endUserId: product.endUserId?.toString() // Include endUserId for order tracking
      };
      
      cart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Dispatch custom event to update cart count in navbar
      try { window.dispatchEvent(new Event('cartUpdated')); } catch {}
      
      toast.success('Added to cart');
      // Navigate to Review Order page so user can continue to Delivery/Payment
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  // Add to wishlist function
  const addToWishlist = async () => {
    if (!product) return;
    
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      if (!wishlist.includes(product._id)) {
        wishlist.push(product._id);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        toast.success('Added to wishlist');
      } else {
        toast('Already in wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">Product not found</p>
      </div>
    );
  }

  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <span>All Products</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary-800 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.image || defaultImage}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            
            {/* Add to Wishlist Button */}
            <button
              onClick={addToWishlist}
              className="w-full bg-white border-2 border-primary-800 text-primary-800 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Heart className="h-5 w-5" />
              <span>Add to wish list</span>
            </button>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-2xl font-bold text-primary-800">
                  ₹ {totalPrice || product.pricePerDay} 
                  <span className="text-sm text-gray-600 font-normal">
                    ({product.pricePerDay}/{selectedDuration})
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  (₹{product.pricePerDay}/per unit)
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.5)</span>
              </div>
            </div>

            {/* Rental Duration Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rental Duration
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value as typeof selectedDuration)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {product.pricePerHour && <option value="hour">Per Hour</option>}
                {product.pricePerDay && <option value="day">Per Day</option>}
                {product.pricePerWeek && <option value="week">Per Week</option>}
                {product.pricePerMonth && <option value="month">Per Month</option>}
                {product.pricePerYear && <option value="year">Per Year</option>}
              </select>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate || new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quantity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 border border-gray-300 rounded-md min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart();
                  }}
                  className="flex-1 bg-primary-800 text-white py-2 px-6 rounded-md font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>

            {/* Apply Coupon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply Coupon
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Coupon Code"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="bg-primary-800 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors">
                  Apply
                </button>
              </div>
            </div>

            {/* Product Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Product descriptions</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>
              <button className="text-primary-800 font-medium mt-2 hover:underline">
                Read More &gt;
              </button>
            </div>

            {/* Terms & Conditions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms & condition</h3>
              <p className="text-gray-600 text-sm">
                Please read our rental terms and conditions before booking.
              </p>
            </div>

            {/* Share */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share :</h3>
              <button className="flex items-center space-x-2 text-primary-800 hover:underline">
                <Share2 className="h-4 w-4" />
                <span>Share this product</span>
              </button>
            </div>
          </div>
        </div>

        {/* Price List Dropdown - Desktop Only */}
        <div className="hidden lg:block fixed top-32 right-8">
          <select className="border border-gray-300 rounded-md px-3 py-2 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>Price List</option>
            <option>Standard Pricing</option>
            <option>Premium Pricing</option>
            <option>Bulk Discount</option>
          </select>
        </div>
      </div>
    </div>
  );
}
