/**
 * Update Stock Page
 * Interface for updating product inventory levels
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Plus,
  Minus,
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  History
} from 'lucide-react';

interface StockData {
  productId: string;
  productName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  maximumStock: number;
  lastUpdated: string;
  stockHistory: Array<{
    date: string;
    action: 'increase' | 'decrease' | 'reserve' | 'return';
    quantity: number;
    reason: string;
    updatedBy: string;
  }>;
}

export default function UpdateStock() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [stockData, setStockData] = useState<StockData | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [minimumStock, setMinimumStock] = useState(0);
  const [maximumStock, setMaximumStock] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mock data - In real app, fetch from API
  useEffect(() => {
    const mockData: StockData = {
      productId: productId,
      productName: 'Professional Camera Kit',
      currentStock: 5,
      reservedStock: 2,
      availableStock: 3,
      minimumStock: 2,
      maximumStock: 20,
      lastUpdated: '2024-01-15T10:30:00Z',
      stockHistory: [
        {
          date: '2024-01-15T10:30:00Z',
          action: 'increase',
          quantity: 3,
          reason: 'New inventory received',
          updatedBy: 'Admin User'
        },
        {
          date: '2024-01-14T14:20:00Z',
          action: 'reserve',
          quantity: 1,
          reason: 'Customer rental booking',
          updatedBy: 'System'
        },
        {
          date: '2024-01-13T09:15:00Z',
          action: 'decrease',
          quantity: 1,
          reason: 'Damaged item removed',
          updatedBy: 'Admin User'
        }
      ]
    };

    setTimeout(() => {
      setStockData(mockData);
      setMinimumStock(mockData.minimumStock);
      setMaximumStock(mockData.maximumStock);
      setLoading(false);
    }, 500);
  }, [productId]);

  const handleStockAdjustment = async () => {
    if (!stockData || adjustmentQuantity <= 0) return;

    setSaving(true);
    try {
      // API call to update stock would go here
      const newStock = adjustmentType === 'increase' 
        ? stockData.currentStock + adjustmentQuantity
        : Math.max(0, stockData.currentStock - adjustmentQuantity);

      const newAvailable = newStock - stockData.reservedStock;

      setStockData(prev => prev ? {
        ...prev,
        currentStock: newStock,
        availableStock: Math.max(0, newAvailable),
        lastUpdated: new Date().toISOString(),
        stockHistory: [
          {
            date: new Date().toISOString(),
            action: adjustmentType,
            quantity: adjustmentQuantity,
            reason: adjustmentReason || `Stock ${adjustmentType}`,
            updatedBy: 'Current User'
          },
          ...prev.stockHistory
        ]
      } : null);

      // Reset form
      setAdjustmentQuantity(1);
      setAdjustmentReason('');
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStockLimitsUpdate = async () => {
    if (!stockData) return;

    setSaving(true);
    try {
      // API call to update stock limits would go here
      setStockData(prev => prev ? {
        ...prev,
        minimumStock,
        maximumStock
      } : null);
    } catch (error) {
      console.error('Error updating stock limits:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = () => {
    if (!stockData) return { status: 'normal', message: '', color: 'gray' };

    if (stockData.availableStock <= 0) {
      return { status: 'out_of_stock', message: 'Out of Stock', color: 'red' };
    } else if (stockData.availableStock <= stockData.minimumStock) {
      return { status: 'low', message: 'Low Stock', color: 'yellow' };
    } else if (stockData.currentStock >= stockData.maximumStock) {
      return { status: 'high', message: 'High Stock', color: 'blue' };
    } else {
      return { status: 'normal', message: 'Normal Stock', color: 'green' };
    }
  };

  const stockStatus = getStockStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
          <button
            onClick={() => router.push('/enduser/products')}
            className="text-primary-600 hover:text-primary-700"
          >
            Return to Products
          </button>
        </div>
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
                onClick={() => router.push('/enduser/products')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Update Stock</h1>
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stock Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{stockData.productName}</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  stockStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                  stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  stockStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {stockStatus.status === 'out_of_stock' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {stockStatus.status === 'normal' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {stockStatus.message}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stockData.currentStock}</div>
                  <div className="text-sm text-gray-600">Total Stock</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stockData.reservedStock}</div>
                  <div className="text-sm text-gray-600">Reserved</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stockData.availableStock}</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
              </div>
            </div>

            {/* Stock Adjustment */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Stock</h3>
              
              <div className="space-y-4">
                {/* Adjustment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="adjustmentType"
                        value="increase"
                        checked={adjustmentType === 'increase'}
                        onChange={(e) => setAdjustmentType(e.target.value as 'increase' | 'decrease')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        Increase Stock
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="adjustmentType"
                        value="decrease"
                        checked={adjustmentType === 'decrease'}
                        onChange={(e) => setAdjustmentType(e.target.value as 'increase' | 'decrease')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                        Decrease Stock
                      </span>
                    </label>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setAdjustmentQuantity(Math.max(1, adjustmentQuantity - 1))}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAdjustmentQuantity(adjustmentQuantity + 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter reason for adjustment"
                  />
                </div>

                {/* Action Button */}
                <button
                  onClick={handleStockAdjustment}
                  disabled={saving}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    adjustmentType === 'increase'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Updating...' : `${adjustmentType === 'increase' ? 'Increase' : 'Decrease'} Stock`}
                </button>
              </div>
            </div>
          </div>

          {/* Stock Settings & History */}
          <div className="space-y-6">
            {/* Stock Limits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Limits</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Stock
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maximumStock}
                    onChange={(e) => setMaximumStock(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <button
                  onClick={handleStockLimitsUpdate}
                  disabled={saving}
                  className="w-full flex items-center justify-center px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Limits
                </button>
              </div>
            </div>

            {/* Stock History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <History className="w-5 h-5 mr-2" />
                Recent Activity
              </h3>
              
              <div className="space-y-3">
                {stockData.stockHistory.slice(0, 5).map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-1 rounded-full ${
                      entry.action === 'increase' ? 'bg-green-100' :
                      entry.action === 'decrease' ? 'bg-red-100' :
                      entry.action === 'reserve' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {entry.action === 'increase' && <TrendingUp className="w-3 h-3 text-green-600" />}
                      {entry.action === 'decrease' && <TrendingDown className="w-3 h-3 text-red-600" />}
                      {entry.action === 'reserve' && <Calendar className="w-3 h-3 text-yellow-600" />}
                      {entry.action === 'return' && <CheckCircle className="w-3 h-3 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.action === 'increase' && '+'}
                        {entry.action === 'decrease' && '-'}
                        {entry.quantity} units
                      </p>
                      <p className="text-xs text-gray-600">{entry.reason}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleDateString()} by {entry.updatedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
