/**
 * Transfer Management Page (Pickup/Return)
 * Handle product pickups and returns for rental orders
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  User,
  Package,
  Truck,
  IndianRupee,
  Clock,
  AlertCircle
} from 'lucide-react';

type TransferType = 'pickup' | 'return';
type TransferStatus = 'draft' | 'ready' | 'waiting' | 'done';

interface Transfer {
  id: string;
  type: TransferType;
  status: TransferStatus;
  customer: string;
  customerEmail: string;
  invoiceAddress: string;
  deliveryAddress: string;
  sourceLocation: string;
  destinationLocation?: string;
  scheduleDate: string;
  responsible: string;
  transferType: 'pickup' | 'delivery';
  orderReference: string;
  products: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
  }>;
  untaxedTotal: number;
  tax: number;
  total: number;
}

export default function TransferManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<TransferType>('pickup');
  const itemsPerPage = 1;

  // Get transfer type from URL params
  useEffect(() => {
    const type = searchParams.get('type') as TransferType;
    if (type === 'pickup' || type === 'return') {
      setSelectedType(type);
    }
  }, [searchParams]);

  // Mock transfer data
  const [transfers] = useState<Transfer[]>([
    {
      id: 'PICKUP/OUT/0001',
      type: 'pickup',
      status: 'draft',
      customer: 'John Doe',
      customerEmail: 'john@example.com',
      invoiceAddress: '123 Main Street, City, State 12345',
      deliveryAddress: '456 Delivery Avenue, City, State 67890',
      sourceLocation: 'Warehouse A, Section 1',
      scheduleDate: '2024-01-20',
      responsible: 'Admin User',
      transferType: 'pickup',
      orderReference: 'R0001',
      products: [
        {
          product: 'Product 1',
          quantity: 5,
          unitPrice: 200,
          subTotal: 1000
        }
      ],
      untaxedTotal: 1000,
      tax: 0,
      total: 1000
    },
    {
      id: 'RETURN/IN/0001',
      type: 'return',
      status: 'waiting',
      customer: 'Jane Smith',
      customerEmail: 'jane@example.com',
      invoiceAddress: '789 Customer Street, City, State 54321',
      deliveryAddress: '321 Pickup Address, City, State 09876',
      sourceLocation: 'Customer Location',
      destinationLocation: 'Warehouse A, Section 1',
      scheduleDate: '2024-01-22',
      responsible: 'Admin User',
      transferType: 'delivery',
      orderReference: 'R0002',
      products: [
        {
          product: 'Product 1',
          quantity: 5,
          unitPrice: 200,
          subTotal: 1000
        }
      ],
      untaxedTotal: 1000,
      tax: 0,
      total: 1000
    }
  ]);

  const currentTransfer = transfers.find(t => t.type === selectedType) || transfers[0];

  const getStatusColor = (status: TransferStatus) => {
    const colors = {
      draft: 'bg-gray-500',
      ready: 'bg-green-500',
      waiting: 'bg-yellow-500',
      done: 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: TransferStatus) => {
    const labels = {
      draft: 'Draft',
      ready: 'Ready',
      waiting: 'Waiting',
      done: 'Done'
    };
    return labels[status] || status;
  };

  const handleStatusChange = (newStatus: TransferStatus) => {
    // Update transfer status logic here
    console.log(`Changing status to: ${newStatus}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/enduser/transfer/create')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Transfer</h1>
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

          {/* Transfer Type Toggle */}
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={() => setSelectedType('pickup')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'pickup'
                  ? 'bg-primary-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Truck className="w-4 h-4 inline mr-2" />
              Pickup
            </button>
            <button
              onClick={() => setSelectedType('return')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'return'
                  ? 'bg-primary-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Return
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                <CheckCircle className="w-4 h-4 mr-2" />
                Check Availability
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
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
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor('draft')}`}>
                Draft
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentTransfer.status === 'ready' || currentTransfer.status === 'waiting' || currentTransfer.status === 'done'
                  ? `text-white ${getStatusColor('ready')}` 
                  : 'text-gray-500 bg-gray-200'
              }`}>
                Ready
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentTransfer.status === 'waiting' || currentTransfer.status === 'done'
                  ? `text-white ${getStatusColor('waiting')}` 
                  : 'text-gray-500 bg-gray-200'
              }`}>
                {selectedType === 'return' ? 'Waiting' : 'Ready'}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentTransfer.status === 'done'
                  ? `text-white ${getStatusColor('done')}` 
                  : 'text-gray-500 bg-gray-200'
              }`}>
                Done
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Transfer Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{currentTransfer.id}</h2>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(currentTransfer.status)}`}>
                {getStatusLabel(currentTransfer.status)}
              </span>
              <span className="text-sm text-gray-600">
                Order: {currentTransfer.orderReference}
              </span>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    {selectedType === 'pickup' ? 'Customer:' : 'Received from Customer:'}
                  </label>
                  <p className="text-gray-900">{currentTransfer.customer}</p>
                  <p className="text-sm text-gray-600">{currentTransfer.customerEmail}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    {selectedType === 'pickup' ? 'Invoice Address:' : 'Pickup Address:'}
                  </label>
                  <p className="text-gray-900">{currentTransfer.invoiceAddress}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Truck className="w-4 h-4 inline mr-2" />
                    {selectedType === 'pickup' ? 'Delivery Address:' : 'Destination Location:'}
                  </label>
                  <p className="text-gray-900">
                    {selectedType === 'pickup' 
                      ? currentTransfer.deliveryAddress 
                      : currentTransfer.destinationLocation
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="w-4 h-4 inline mr-2" />
                    Source Location:
                  </label>
                  <p className="text-gray-900">{currentTransfer.sourceLocation}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Schedule Date:
                  </label>
                  <p className="text-gray-900">{currentTransfer.scheduleDate}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Responsible:
                  </label>
                  <p className="text-gray-900">{currentTransfer.responsible}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Truck className="w-4 h-4 inline mr-2" />
                    Transfer Type:
                  </label>
                  <p className="text-gray-900 capitalize">{currentTransfer.transferType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Lines Tabs */}
          <div className="border-t border-gray-200">
            <div className="flex space-x-8 px-6">
              <button className="border-b-2 border-primary-500 py-4 text-sm font-medium text-primary-600">
                Transfer lines
              </button>
              <button className="py-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                Other details
              </button>
              <button className="py-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                Transfer Notes
              </button>
            </div>
          </div>

          {/* Transfer Lines Table */}
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
                  {currentTransfer.products.map((line, index) => (
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

            {/* Totals */}
            <div className="mt-8 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Untaxed Total:</span>
                  <span className="text-sm font-medium flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {currentTransfer.untaxedTotal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax:</span>
                  <span className="text-sm font-medium flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {currentTransfer.tax}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-semibold text-gray-900 flex items-center">
                    <IndianRupee className="w-5 h-5 mr-1" />
                    {currentTransfer.total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {currentTransfer.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange('ready')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Ready
                  </button>
                )}
                {currentTransfer.status === 'ready' && (
                  <button
                    onClick={() => handleStatusChange('waiting')}
                    className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Start Transfer
                  </button>
                )}
                {currentTransfer.status === 'waiting' && (
                  <button
                    onClick={() => handleStatusChange('done')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Transfer
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Transfer Status Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pickup Process</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span><strong>Draft:</strong> Transfer order created</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span><strong>Ready:</strong> Items prepared for pickup</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span><strong>Done:</strong> Items delivered to customer</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Return Process</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span><strong>Draft:</strong> Return order created</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span><strong>Waiting:</strong> Awaiting customer return</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span><strong>Ready:</strong> Items ready for collection</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span><strong>Done:</strong> Items returned to inventory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
