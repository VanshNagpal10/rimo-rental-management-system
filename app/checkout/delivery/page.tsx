/**
 * Delivery Address Page
 * Collects delivery and billing address information
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Script from 'next/script';

declare global {
  interface Window {
    Razorpay: any;
  }
}

import { 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CheckoutData {
  items: any[];
  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    tax: number;
    total: number;
  };
  couponCode: string;
  bookingId: string;
}

export default function DeliveryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [billingAddress, setBillingAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('');
  const [deliveryMethods] = useState([
    { id: 'standard', name: 'Standard Delivery', time: '3-5 days', price: 0 },
    { id: 'express', name: 'Express Delivery', time: '1-2 days', price: 50 },
    { id: 'same-day', name: 'Same Day Delivery', time: 'Same day', price: 100 }
  ]);

  // Redirect if not customer
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'customer') {
      router.push('/login');
    }
  }, [session, status, router]);

  // Load checkout data
  useEffect(() => {
    try {
      const data = localStorage.getItem('checkoutData');
      if (!data) {
        toast.error('No checkout data found');
        router.push('/cart');
        return;
      }
      
      const parsedData = JSON.parse(data);
      setCheckoutData(parsedData);
      
      // Pre-fill with user data if available
      if (session?.user) {
        const userData = {
          name: session.user.name || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          landmark: ''
        };
        setDeliveryAddress(userData);
        setBillingAddress(userData);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      router.push('/cart');
    } finally {
      setLoading(false);
    }
  }, [session, router]);

  // Handle same as delivery toggle
  useEffect(() => {
    if (sameAsDelivery) {
      setBillingAddress({ ...deliveryAddress });
    }
  }, [sameAsDelivery, deliveryAddress]);

  // Validate form
  const validateForm = () => {
    const requiredFields = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    
    for (const field of requiredFields) {
      if (!deliveryAddress[field as keyof typeof deliveryAddress].trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    if (!sameAsDelivery) {
      for (const field of requiredFields) {
        if (!billingAddress[field as keyof typeof billingAddress].trim()) {
          toast.error(`Please fill in billing ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return false;
        }
      }
    }
    
    if (!selectedDeliveryMethod) {
      toast.error('Please select a delivery method');
      return false;
    }
    
    return true;
  };

  const handleCheckout = async () => {
    if (!checkoutData) {
      toast.error('Order details not loaded yet.');
      return;
    }

    try {
      const selectedMethod = deliveryMethods.find(m => m.id === selectedDeliveryMethod);
      const updatedPricing = {
        ...checkoutData.pricing,
        deliveryCharge: selectedMethod?.price || 0,
        total: checkoutData.pricing.subtotal - checkoutData.pricing.discount + (selectedMethod?.price || 0) + checkoutData.pricing.tax
      };
      
      const orderData = {
        ...checkoutData,
        pricing: updatedPricing,
        addresses: {
          delivery: deliveryAddress,
          billing: sameAsDelivery ? deliveryAddress : billingAddress
        },
        deliveryMethod: selectedMethod
      };

      const orderRes = await axios.post('/api/payments/order', { amount: orderData.pricing.total });
      const order = orderRes.data;
      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'RIMO',
        order_id: order.id,
        notes: { bookingId: checkoutData.bookingId },
        handler: async function (response: any) {
          // verify server-side
          const verifyRes = await axios.post('/api/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: checkoutData.bookingId
          });
          if ((verifyRes.data?.success ?? verifyRes.data?.ok) === true) {
            // Build order snapshot and redirect to invoice success
            const completeOrderData = {
              orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
              orderDate: new Date().toLocaleDateString(),
              customerPhone: deliveryAddress.phone || '',
              deliveryAddress: deliveryAddress,
              billingAddress: sameAsDelivery ? deliveryAddress : billingAddress,
              items: checkoutData.items,
              pricing: {
                ...checkoutData.pricing,
                deliveryCharge: selectedMethod?.price || 0,
                total: checkoutData.pricing.subtotal - checkoutData.pricing.discount + (selectedMethod?.price || 0) + checkoutData.pricing.tax
              },
              paymentMethod: 'Razorpay',
              deliveryMethod: selectedMethod,
            } as any;

            try {
              localStorage.setItem('orderData', JSON.stringify(completeOrderData));
              // Consume inventory on server
              await axios.post('/api/orders/complete', {
                customer: { name: session?.user?.name, email: session?.user?.email },
                items: (checkoutData.items || []).map((it: any) => ({
                  productId: it.productId,
                  quantity: it.quantity || 1,
                  startDate: it.fromDate,
                  endDate: it.toDate,
                  durationUnit: it.duration,
                  pricePerUnit: it.pricePerUnit,
                  totalPrice: it.totalPrice,
                  endUserId: it?.endUserId,
                  deliveryAddress: deliveryAddress,
                })),
              });
              localStorage.removeItem('cart');
              localStorage.removeItem('checkoutData');
              window.dispatchEvent(new Event('cartUpdated'));
            } catch (error) {
              console.error('Error calling /api/orders/complete:', error);
              // Don't fail the checkout if inventory update fails, but log it
            }
            toast.success('Payment successful!');
            router.push('/orders/success');
          } else {
            toast.error('Payment verification failed. Please try again.');
          }
        }
      };
      // @ts-ignore
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  // Proceed to payment
  const proceedToPayment = () => {
    if (!validateForm()) return;
    
    if (!checkoutData) {
      toast.error('Checkout data not found');
      return;
    }
    
    const selectedMethod = deliveryMethods.find(m => m.id === selectedDeliveryMethod);
    const updatedPricing = {
      ...checkoutData.pricing,
      deliveryCharge: selectedMethod?.price || 0,
      total: checkoutData.pricing.subtotal - checkoutData.pricing.discount + (selectedMethod?.price || 0) + checkoutData.pricing.tax
    };
    
    const orderData = {
      ...checkoutData,
      pricing: updatedPricing,
      addresses: {
        delivery: deliveryAddress,
        billing: sameAsDelivery ? deliveryAddress : billingAddress
      },
      deliveryMethod: selectedMethod
    };
    
    localStorage.setItem('orderData', JSON.stringify(orderData));
    router.push('/checkout/payment');
  };

  // Go back to cart
  const goBackToCart = () => {
    router.push('/cart');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-800"></div>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500 text-lg">Checkout data not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button onClick={goBackToCart} className="hover:text-primary-800 transition-colors">
            Review Order
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary-800 font-medium">Delivery</span>
          <ChevronRight className="h-4 w-4" />
          <span>Payment</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Address Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Address */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-600 mb-6">Delivery Address</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.name}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={deliveryAddress.address}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter full address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.state}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="State"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Pincode"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryAddress.landmark}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, landmark: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nearby landmark"
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-red-600">Invoice Address</h2>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sameAsDelivery}
                    onChange={(e) => setSameAsDelivery(e.target.checked)}
                    className="rounded border-gray-300 text-primary-800 focus:ring-primary-500"
                  />
                  <span className="text-sm text-blue-600">Billing address same as delivery address</span>
                </label>
              </div>
              
              {!sameAsDelivery && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.name}
                        onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={billingAddress.phone}
                        onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      value={billingAddress.address}
                      onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter full address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="City"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500"
                        placeholder="State"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.pincode}
                        onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Pincode"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Delivery Method */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Delivery Method</h3>
              
              <div className="space-y-3">
                {deliveryMethods.map((method) => (
                  <label key={method.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={method.id}
                      checked={selectedDeliveryMethod === method.id}
                      onChange={(e) => setSelectedDeliveryMethod(e.target.value)}
                      className="text-primary-800 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{method.name}</span>
                        <span className="text-primary-800 font-semibold">
                          {method.price === 0 ? '₹0' : `₹${method.price}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{method.time}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-600">Order Summary</h3>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="text-sm text-blue-600 mb-4">
                {checkoutData.items.length} Items - ₹ {checkoutData.pricing.subtotal.toFixed(2)}
              </div>
              
              <div className="space-y-3 mb-6">
                {checkoutData.pricing.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Delivery Charge</span>
                    <span>-</span>
                  </div>
                )}
                
                <div className="flex justify-between text-red-600">
                  <span>Sub Total</span>
                  <span>₹{checkoutData.pricing.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-red-600">
                  <span>Taxes</span>
                  <span>₹{checkoutData.pricing.tax}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-red-600">
                    <span>Total</span>
                    <span>₹{(checkoutData.pricing.subtotal + checkoutData.pricing.tax + (deliveryMethods.find(m => m.id === selectedDeliveryMethod)?.price || 0)).toFixed(2)}</span>
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
                    defaultValue={checkoutData.couponCode}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Coupon Code"
                  />
                  <button className="bg-primary-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-red-500 text-white py-3 rounded-md font-medium hover:bg-red-600 transition-colors"
                >
                  Confirm
                </button>
                
                <button
                  onClick={goBackToCart}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>back to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
