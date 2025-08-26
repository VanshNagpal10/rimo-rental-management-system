/**
 * Cart/Review Order Page
 * Shows cart items, allows quantity adjustment, and proceeds to checkout
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Plus, 
  Minus, 
  Heart, 
  Trash2, 
  ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  duration: string;
  fromDate: string;
  toDate: string;
  pricePerUnit: number;
  totalPrice: number;
  endUserId?: string; // Include endUserId for order tracking
  pricePerDay?: number; // For backward compatibility with older cart items
}

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Redirect if not customer
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'customer') {
      router.push('/login');
    }
  }, [session, status, router]);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(cart);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update cart in localStorage
  const updateCart = (newCart: CartItem[]) => {
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    
    // Dispatch custom event to update cart count in navbar
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Update quantity
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = [...cartItems];
    updatedCart[index].quantity = newQuantity;
    
    // Recalculate total price based on available price information
    if (updatedCart[index].pricePerUnit) {
      updatedCart[index].totalPrice = updatedCart[index].pricePerUnit * newQuantity;
    } else if (updatedCart[index].pricePerDay) {
      updatedCart[index].totalPrice = updatedCart[index].pricePerDay * newQuantity;
    }
    
    updateCart(updatedCart);
  };

  // Remove item from cart
  const removeItem = (index: number) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    updateCart(updatedCart);
    toast.success('Item removed from cart');
  };

  // Move to wishlist
  const moveToWishlist = (index: number) => {
    const item = cartItems[index];
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      if (!wishlist.includes(item.productId)) {
        wishlist.push(item.productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
      }
      removeItem(index);
      toast.success('Moved to wishlist');
    } catch (error) {
      console.error('Error moving to wishlist:', error);
      toast.error('Failed to move to wishlist');
    }
  };

  // Apply coupon
  const applyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    // Mock coupon validation
    const validCoupons: { [key: string]: number } = {
      'SAVE10': 10,
      'WELCOME20': 20,
      'DISCOUNT15': 15
    };
    
    const discountPercent = validCoupons[couponCode.toUpperCase()];
    if (discountPercent) {
      setDiscount(discountPercent);
      toast.success(`Coupon applied! ${discountPercent}% discount`);
    } else {
      toast.error('Invalid coupon code');
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.totalPrice || (item.pricePerDay || 0) * (item.quantity || 1);
    return sum + itemPrice;
  }, 0);
  const discountAmount = (subtotal * discount) / 100;
  const deliveryCharge = 0; // Free delivery as shown in wireframe
  const tax = Math.round(subtotal * 0.01); // 1% tax
  const total = subtotal - discountAmount + deliveryCharge + tax;

  // Proceed to checkout
  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Store checkout data
    const checkoutData = {
      items: cartItems,
      pricing: {
        subtotal,
        discount: discountAmount,
        deliveryCharge,
        tax,
        total
      },
      couponCode: discount > 0 ? couponCode : ''
    };
    
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    router.push('/checkout/delivery');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <span>Review Order</span>
          <ChevronRight className="h-4 w-4" />
          <span>Delivery</span>
          <ChevronRight className="h-4 w-4" />
          <span>Payment</span>
        </nav>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
            <Link 
              href="/shop"
              className="bg-primary-800 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Overview</h2>
              
              <div className="space-y-6">
                {cartItems.map((item, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      {/* Product Image */}
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={item.image || defaultImage}
                          alt={item.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-primary-800 font-bold text-xl mb-2">
                          ₹{item.totalPrice ? item.totalPrice.toFixed(2) : (item.pricePerDay || 0).toFixed(2)}
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          {item.duration && <p>Duration: {item.duration}</p>}
                          {item.fromDate && item.toDate && <p>From: {item.fromDate} To: {item.toDate}</p>}
                          {item.pricePerUnit && item.duration && <p>Rate: ₹{item.pricePerUnit}/{item.duration}</p>}
                          {!item.duration && <p>Price: ₹{item.pricePerDay || 0}/day</p>}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Qty</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3 py-1 border border-gray-300 rounded min-w-[2.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => moveToWishlist(index)}
                            className="p-2 text-gray-600 hover:text-primary-800 transition-colors"
                            title="Move to wishlist"
                          >
                            <Heart className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => removeItem(index)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Sub Total</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%)</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Charge</span>
                    <span className="text-green-600">
                      {deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Taxes</span>
                    <span>₹{tax}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Apply Coupon */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apply Coupon
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon Code"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={applyCoupon}
                      className="bg-primary-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Proceed to Checkout */}
                <button
                  onClick={proceedToCheckout}
                  className="w-full bg-primary-800 text-white py-3 rounded-md font-medium hover:bg-primary-700 transition-colors"
                >
                  Proceed to checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
