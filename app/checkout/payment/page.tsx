/**
 * Payment Page
 * Handles payment method selection and processing
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Note: Do not import the server-side Razorpay SDK on the client.
// We load the checkout script and use window.Razorpay instead.

import { 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderData {
  items: any[];
  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    tax: number;
    total: number;
  };
  couponCode: string;
  addresses: {
    delivery: any;
    billing: any;
  };
  deliveryMethod: any;
  bookingId: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
}

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit-card');
  const [processing, setProcessing] = useState(false);
  const [showMobileCheckout, setShowMobileCheckout] = useState(false);
  
  // Payment form states
  const [cardDetails, setCardDetails] = useState({
    nameOnCard: '',
    cardNumber: '',
    expiryDate: '',
    securityCode: '',
    saveCard: false
  });

  // Payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'credit-card',
      name: 'Credit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'debit-card',
      name: 'Debit Card',
      icon: CreditCard,
      description: 'All major debit cards accepted'
    },
    {
      id: 'upi',
      name: 'UPI Pay',
      icon: Smartphone,
      description: 'Google Pay, PhonePe, Paytm'
    },
    {
      id: 'paypal',
      name: 'Paypal',
      icon: Wallet,
      description: 'Pay with your PayPal account'
    },
    {
      id: 'razorpay',
      name: 'Razorpay',
      icon: Wallet,
      description: 'Pay with Razorpay'
    }
  ];

  // Redirect if not customer
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'customer') {
      router.push('/login');
    }
  }, [session, status, router]);

  // Load order data
  useEffect(() => {
    try {
      const data = localStorage.getItem('orderData');
      if (!data) {
        toast.error('No order data found');
        router.push('/cart');
        return;
      }
      
      const parsedData = JSON.parse(data);
      setOrderData(parsedData);
      
      // Pre-fill card holder name
      if (session?.user?.name) {
        setCardDetails(prev => ({
          ...prev,
          nameOnCard: session.user.name || ''
        }));
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      router.push('/cart');
    } finally {
      setLoading(false);
    }
  }, [session, router]);

  // Format card number
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Validate payment form
  const validatePaymentForm = () => {
    if (selectedPaymentMethod === 'credit-card' || selectedPaymentMethod === 'debit-card') {
      const { nameOnCard, cardNumber, expiryDate, securityCode } = cardDetails;
      
      if (!nameOnCard.trim()) {
        toast.error('Please enter name on card');
        return false;
      }
      
      if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 13) {
        toast.error('Please enter a valid card number');
        return false;
      }
      
      if (!expiryDate || expiryDate.length < 5) {
        toast.error('Please enter valid expiry date');
        return false;
      }
      
      if (!securityCode || securityCode.length < 3) {
        toast.error('Please enter valid security code');
        return false;
      }
    }
    
    return true;
  };

  // Process payment
  const processPayment = async () => {
    if (!validatePaymentForm()) return;
    if (!orderData) {
      toast.error('Order data not found');
      return;
    }
    
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create order in database (mock)
      const orderPayload = {
        items: orderData.items,
        addresses: orderData.addresses,
        deliveryMethod: orderData.deliveryMethod,
        paymentMethod: selectedPaymentMethod,
        pricing: orderData.pricing,
        status: 'confirmed'
      };
      
      // Save order data for invoice generation
      const completeOrderData = {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        orderDate: new Date().toLocaleDateString(),
        customerPhone: orderData.addresses?.delivery?.phone || '',
        deliveryAddress: orderData.addresses?.delivery || {},
        billingAddress: orderData.addresses?.billing || orderData.addresses?.delivery || {},
        items: orderData.items || [],
        pricing: orderData.pricing || {},
        paymentMethod: selectedPaymentMethod,
        deliveryMethod: orderData.deliveryMethod || 'Standard Delivery'
      };
      
      localStorage.setItem('orderData', JSON.stringify(completeOrderData));
      // Consume inventory and create orders on server so stock/availability updates and dashboards populate
      try {
        const resp = await fetch('/api/orders/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: { name: session?.user?.name, email: session?.user?.email },
            items: (orderData.items || []).map((it: any) => ({
              productId: it.productId,
              quantity: it.quantity || 1,
              startDate: it.fromDate,
              endDate: it.toDate,
              durationUnit: it.duration,
              pricePerUnit: it.pricePerUnit,
              totalPrice: it.totalPrice,
              endUserId: it?.endUserId,
              deliveryAddress: orderData?.addresses?.delivery,
            })),
          }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(()=>({error:'Inventory error'}));
          toast.error(err.error || 'Inventory update failed');
        }
      } catch {}
      
      // Clear cart and checkout data
      localStorage.removeItem('cart');
      localStorage.removeItem('checkoutData');
      // Broadcast cart update so Navbar badge refreshes immediately in this tab
      try {
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (_) {
        // no-op
      }
      
      toast.success('Payment successful! Order confirmed');
      router.push('/orders/success');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const makeRazorpayPayment = async () => {
    if (!orderData) {
      toast.error('Order details not found.');
      return;
    }

    const res = await fetch('/api/payments/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: orderData.pricing.total }),
    });

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      name: 'RIMO',
      currency: order.currency,
      amount: order.amount,
      order_id: order.id,
      description: 'Thank you for your purchase',
      notes: { bookingId: orderData.bookingId },
      handler: async (response: any) => {
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: orderData.bookingId,
          }),
        });

        const result = await verifyRes.json();
        if ((result.success ?? result.ok) === true) {
          // Build invoice payload similar to card flow
          const completeOrderData = {
            orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
            orderDate: new Date().toLocaleDateString(),
            customerPhone: orderData.addresses?.delivery?.phone || '',
            deliveryAddress: orderData.addresses?.delivery || {},
            billingAddress: orderData.addresses?.billing || orderData.addresses?.delivery || {},
            items: orderData.items || [],
            pricing: orderData.pricing || {},
            paymentMethod: 'Razorpay',
            deliveryMethod: orderData.deliveryMethod || 'Standard Delivery',
          };

          try {
            localStorage.setItem('orderData', JSON.stringify(completeOrderData));
            // Consume inventory and create orders (same as card flow)
            try {
              const resp = await fetch('/api/orders/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customer: { name: session?.user?.name, email: session?.user?.email },
                  items: (orderData.items || []).map((it: any) => ({
                    productId: it.productId,
                    quantity: it.quantity || 1,
                    startDate: it.fromDate,
                    endDate: it.toDate,
                    durationUnit: it.duration,
                    pricePerUnit: it.pricePerUnit,
                    totalPrice: it.totalPrice,
                    endUserId: it?.endUserId,
                    deliveryAddress: orderData?.addresses?.delivery,
                  })),
                }),
              });
              if (!resp.ok) {
                // Surface inventory issues to the user
                const err = await resp.json().catch(()=>({error:'Inventory error'}));
                toast.error(err.error || 'Inventory update failed');
              }
            } catch {}
            localStorage.removeItem('cart');
            localStorage.removeItem('checkoutData');
            window.dispatchEvent(new Event('cartUpdated'));
          } catch {}

          toast.success('Payment successful!');
          router.push('/orders/success');
        } else {
          toast.error('Payment verification failed. Please try again.');
        }
      },
      prefill: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        contact: '9999999999',
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  // Go back to delivery
  const goBackToDelivery = () => {
    router.push('/checkout/delivery');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-800"></div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500 text-lg">Order data not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button onClick={() => router.push('/cart')} className="hover:text-primary-800 transition-colors">
            Review Order
          </button>
          <ChevronRight className="h-4 w-4" />
          <button onClick={goBackToDelivery} className="hover:text-primary-800 transition-colors">
            Delivery
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary-800 font-medium">Payment</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-600 mb-6">Confirm Order</h2>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a payment method</h3>
                
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label 
                      key={method.id} 
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedPaymentMethod === method.id}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="text-primary-800 focus:ring-primary-500"
                      />
                      <method.icon className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{method.name}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Card Details Form */}
              {(selectedPaymentMethod === 'credit-card' || selectedPaymentMethod === 'debit-card') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardDetails.nameOnCard}
                      onChange={(e) => setCardDetails({ ...cardDetails, nameOnCard: e.target.value })}
                      placeholder="Placeholder"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ 
                        ...cardDetails, 
                        cardNumber: formatCardNumber(e.target.value)
                      })}
                      placeholder="•••• •••• •••• ••••"
                      maxLength={19}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiryDate}
                        onChange={(e) => setCardDetails({ 
                          ...cardDetails, 
                          expiryDate: formatExpiryDate(e.target.value)
                        })}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Security Code
                      </label>
                      <input
                        type="text"
                        value={cardDetails.securityCode}
                        onChange={(e) => setCardDetails({ 
                          ...cardDetails, 
                          securityCode: e.target.value.replace(/\D/g, '').slice(0, 4)
                        })}
                        placeholder="CVV"
                        maxLength={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={cardDetails.saveCard}
                      onChange={(e) => setCardDetails({ ...cardDetails, saveCard: e.target.checked })}
                      className="rounded border-gray-300 text-primary-800 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Save my card details</span>
                  </label>
                </div>
              )}

              {/* UPI Payment */}
              {selectedPaymentMethod === 'upi' && (
                <div className="text-center py-8">
                  <Smartphone className="h-16 w-16 text-primary-800 mx-auto mb-4" />
                  <p className="text-gray-600">You will be redirected to your UPI app to complete the payment</p>
                </div>
              )}

              {/* PayPal Payment */}
              {selectedPaymentMethod === 'paypal' && (
                <div className="text-center py-8">
                  <Wallet className="h-16 w-16 text-primary-800 mx-auto mb-4" />
                  <p className="text-gray-600">You will be redirected to PayPal to complete the payment</p>
                </div>
              )}

              {/* Razorpay Payment */}
              {selectedPaymentMethod === 'razorpay' && (
                <div className="text-center py-8">
                  <Wallet className="h-16 w-16 text-primary-800 mx-auto mb-4" />
                  <p className="text-gray-600">You will be redirected to Razorpay to complete the payment</p>
                  <button
                    onClick={makeRazorpayPayment}
                    className="w-full bg-red-500 text-white py-3 rounded-md font-medium hover:bg-red-600 transition-colors"
                  >
                    Pay Now
                  </button>
                </div>
              )}
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
                {orderData.items.length} Items - ₹ {orderData.pricing.total.toFixed(2)}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge</span>
                  <span className="text-red-600">
                    {orderData.pricing.deliveryCharge === 0 ? '-' : `₹${orderData.pricing.deliveryCharge}`}
                  </span>
                </div>
                
                <div className="flex justify-between text-red-600">
                  <span>Sub Total</span>
                  <span>₹{orderData.pricing.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-red-600">
                  <span>Taxes</span>
                  <span>₹{orderData.pricing.tax}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-red-600">
                    <span>Total</span>
                    <span>₹{orderData.pricing.total.toFixed(2)}</span>
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
                    defaultValue={orderData.couponCode}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Coupon Code"
                  />
                  <button className="bg-primary-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Payment Button */}
              {selectedPaymentMethod !== 'razorpay' && (
                <button
                  onClick={processPayment}
                  disabled={processing}
                  className="w-full bg-red-500 text-white py-3 rounded-md font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Pay Now</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Checkout Steps */}
        <div className="md:hidden fixed bottom-20 left-0 right-0 bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Checkout</div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Shipping</span>
                <CheckCircle className="h-4 w-4" />
                <span>Payment</span>
                <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                <span>Review</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowMobileCheckout(!showMobileCheckout)}
              className="text-white"
            >
              <ChevronDown className={`h-5 w-5 transform transition-transform ${showMobileCheckout ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showMobileCheckout && (
            <div className="mt-4 space-y-3">
              <div className="bg-white rounded-md p-4 text-gray-900">
                <h4 className="font-medium mb-2">Choose a payment method</h4>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-2 border rounded text-xs ${
                        selectedPaymentMethod === method.id 
                          ? 'border-primary-800 bg-primary-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      <method.icon className="h-4 w-4 mx-auto mb-1" />
                      {method.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {selectedPaymentMethod !== 'razorpay' && (
                <button
                  onClick={processPayment}
                  disabled={processing}
                  className="w-full bg-primary-800 text-white py-3 rounded-md font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm and Continue'}
                </button>
              )}
            </div>
          )}
        </div>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </div>
    </div>
  );
}
