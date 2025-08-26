/**
 * Order Success Page
 * Shows confirmation after successful payment
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CheckCircle, Download, Eye } from 'lucide-react';
import { generateInvoicePDF, InvoiceData } from '@/lib/pdfGenerator';
import { generateSimpleInvoicePDF } from '@/lib/simplePdfGenerator';
import toast from 'react-hot-toast';

export default function OrderSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orderData, setOrderData] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Load order data from localStorage (saved during checkout)
  useEffect(() => {
    try {
      const savedOrderData = localStorage.getItem('orderData');
      const savedCheckoutData = localStorage.getItem('checkoutData');
      
      if (savedOrderData) {
        setOrderData(JSON.parse(savedOrderData));
      } else if (savedCheckoutData) {
        // Fallback to checkout data if order data not found
        const checkoutData = JSON.parse(savedCheckoutData);
        setOrderData({
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          orderDate: new Date().toLocaleDateString(),
          ...checkoutData
        });
      }
    } catch (error) {
      console.error('Error loading order data:', error);
    }
  }, []);

  // Redirect if not customer
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'customer') {
      router.push('/login');
    }
  }, [session, status, router]);

  // Generate and download PDF invoice
  const handleDownloadInvoice = async () => {
    if (!orderData) {
      toast.error('Order data not found');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      console.log('Order data:', orderData);
      console.log('Session:', session);
      
      // Prepare invoice data
      const invoiceData: InvoiceData = {
        orderNumber: orderData.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
        orderDate: orderData.orderDate || new Date().toLocaleDateString(),
        customerName: session?.user?.name || 'Customer',
        customerEmail: session?.user?.email || '',
        customerPhone: orderData.customerPhone || '',
        deliveryAddress: orderData.deliveryAddress || {
          street: orderData.address || '123 Main Street',
          city: orderData.city || 'City',
          state: orderData.state || 'State',
          zipCode: orderData.zipCode || '12345',
          country: orderData.country || 'India',
          landmark: orderData.landmark
        },
        billingAddress: orderData.billingAddress,
        items: orderData.items || [],
        pricing: orderData.pricing || {
          subtotal: 0,
          discount: 0,
          discountAmount: 0,
          deliveryCharge: 0,
          tax: 0,
          total: 0
        },
        paymentMethod: orderData.paymentMethod || 'Credit Card',
        deliveryMethod: orderData.deliveryMethod || 'Standard Delivery'
      };

      // Try to generate complex PDF first
      try {
        await generateInvoicePDF(invoiceData);
        toast.success('Invoice downloaded successfully!');
      } catch (pdfError) {
        console.warn('Complex PDF failed, trying simple version:', pdfError);
        // Fallback to simple PDF
        await generateSimpleInvoicePDF(orderData, session);
        toast.success('Invoice downloaded successfully (simple format)!');
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate invoice. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" title="Order Confirmed">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="mb-8">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">#ORD-{Date.now().toString().slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span className="font-medium text-green-600">Paid</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Status:</span>
              <span className="font-medium text-blue-600">Confirmed</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center justify-center space-x-2 bg-primary-800 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors">
              <Eye className="h-4 w-4" />
              <span>View Order</span>
            </button>
            
            <button 
              onClick={handleDownloadInvoice}
              disabled={isGeneratingPDF}
              className="flex items-center justify-center space-x-2 border border-primary-800 text-primary-800 px-6 py-3 rounded-md font-medium hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`h-4 w-4 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
              <span>{isGeneratingPDF ? 'Generating...' : 'Download Invoice'}</span>
            </button>
          </div>

          <Link 
            href="/shop"
            className="inline-block text-primary-800 hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

