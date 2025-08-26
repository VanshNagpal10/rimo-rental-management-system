/**
 * Individual Rental Order View Page
 * Detailed view and management of a specific rental order
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Send,
  Printer,
  CheckCircle,
  XCircle,
  Edit,
  Truck,
  Package,
  IndianRupee,
  Calendar,
  MapPin,
  User,
  FileText
} from 'lucide-react';

interface RentalOrder {
  id: string;
  customer: string;
  customerEmail: string;
  invoiceAddress: string;
  deliveryAddress: string;
  rentalTemplate: string;
  expiration: string;
  rentalOrderDate: string;
  pricelist: string;
  rentalPeriod: string;
  rentalDuration: string;
  status: 'quotation' | 'quotation_sent' | 'rental_order';
  orderLines: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
    tax: number;
    subTotal: number;
  }>;
  untaxedTotal: number;
  tax: number;
  total: number;
  termsConditions: string;
}

export default function RentalOrderView() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<RentalOrder | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'quotation' | 'quotation_sent' | 'rental_order'>('quotation');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Mock data based on wireframes
  useEffect(() => {
    const mockOrder: RentalOrder = {
      id: params.id as string || 'R0001',
      customer: 'Customer Name',
      customerEmail: 'customer@example.com',
      invoiceAddress: '123 Main Street, City, State 12345',
      deliveryAddress: '456 Delivery Avenue, City, State 67890',
      rentalTemplate: 'Standard Rental Template',
      expiration: '2024-12-31',
      rentalOrderDate: '2024-01-15',
      pricelist: 'Standard Pricing',
      rentalPeriod: '7 days',
      rentalDuration: '1 week',
      status: 'quotation',
      orderLines: [
        {
          product: 'Product 1',
          quantity: 5,
          unitPrice: 200,
          tax: 0,
          subTotal: 1000
        }
      ],
      untaxedTotal: 1000,
      tax: 0,
      total: 1000,
      termsConditions: 'Standard terms and conditions apply for this rental agreement.'
    };
    setOrder(mockOrder);
    setCurrentStatus(mockOrder.status);
  }, [params.id]);

  const handleStatusChange = (newStatus: 'quotation' | 'quotation_sent' | 'rental_order') => {
    setCurrentStatus(newStatus);
    if (order) {
      setOrder({ ...order, status: newStatus });
    }
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    handleStatusChange('rental_order');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quotation': return 'bg-yellow-500';
      case 'quotation_sent': return 'bg-blue-500'; 
      case 'rental_order': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/enduser/orders')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Rental Orders</h1>
              <Settings className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">1/80</span>
              <button className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                <Send className="w-4 h-4 mr-2" />
                Sent
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirmed}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>

            {/* Status Progress */}
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor('quotation')}`}>
                Quotation
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentStatus === 'quotation_sent' || currentStatus === 'rental_order' 
                  ? `text-white ${getStatusColor('quotation_sent')}` 
                  : 'text-gray-500 bg-gray-200'
              }`}>
                Quotation Sent
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentStatus === 'rental_order' 
                  ? `text-white ${getStatusColor('rental_order')}` 
                  : 'text-gray-500 bg-gray-200'
              }`}>
                Rental Order
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Order Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{order.id}</h2>
                {isConfirmed && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirmed
                  </div>
                )}
              </div>
              <button
                disabled={isConfirmed}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Update Prices
              </button>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Customer:
                  </label>
                  <p className="text-gray-900">{order.customer}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Invoice Address:
                  </label>
                  <p className="text-gray-900">{order.invoiceAddress}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Truck className="w-4 h-4 inline mr-2" />
                    Delivery Address:
                  </label>
                  <p className="text-gray-900">{order.deliveryAddress}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Rental Template:
                  </label>
                  <p className="text-gray-900">{order.rentalTemplate}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Expiration:
                  </label>
                  <p className="text-gray-900">{order.expiration}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Rental Order Date:
                  </label>
                  <p className="text-gray-900">{order.rentalOrderDate}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <IndianRupee className="w-4 h-4 inline mr-2" />
                    Pricelist:
                  </label>
                  <p className="text-gray-900">{order.pricelist}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Rental Period:
                  </label>
                  <p className="text-gray-900">{order.rentalPeriod}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Rental Duration:
                  </label>
                  <p className="text-gray-900">{order.rentalDuration}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Lines Tabs */}
          <div className="border-t border-gray-200">
            <div className="flex space-x-8 px-6">
              <button className="border-b-2 border-primary-500 py-4 text-sm font-medium text-primary-600">
                Order lines
              </button>
              <button className="py-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                Other details
              </button>
              <button className="py-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                Rental Notes
              </button>
            </div>
          </div>

          {/* Order Lines Table */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Product</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Quantity</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Unit Price</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Tax</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Sub Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderLines.map((line, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 text-sm font-medium text-gray-900">{line.product}</td>
                      <td className="py-4 text-sm text-gray-600 text-center">{line.quantity}</td>
                      <td className="py-4 text-sm text-gray-600 text-center">{line.unitPrice}</td>
                      <td className="py-4 text-sm text-gray-600 text-center">-</td>
                      <td className="py-4 text-sm text-gray-600 text-right">{line.subTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Terms & Conditions */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                <p className="text-sm text-gray-600">{order.termsConditions}</p>
              </div>

              <div className="text-right space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Untaxed Total:</span>
                  <span className="text-sm font-medium flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {order.untaxedTotal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax:</span>
                  <span className="text-sm font-medium flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {order.tax}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-semibold text-gray-900 flex items-center">
                    <IndianRupee className="w-5 h-5 mr-1" />
                    {order.total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          {isConfirmed && (
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/enduser/orders/${order.id}/invoice`)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Invoice
                </button>
                <button
                  onClick={() => router.push(`/enduser/transfer?type=pickup&orderId=${order.id}`)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Pickup
                </button>
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
