/**
 * End User Orders Page
 * Rental orders management with card and list views, status filters
 */

'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  Search,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  IndianRupee
} from 'lucide-react';

interface RentalOrder {
  id: string;
  customer: string;
  amount: number;
  status: 'quotation' | 'quotation_sent' | 'reserved' | 'pickedup' | 'returned';
  invoiceStatus: 'nothing_to_invoice' | 'to_invoice' | 'fully_invoiced';
  orderDate: string;
  pickupDate?: string;
  returnDate?: string;
  orderReference: string;
  createdBy: string;
}

export default function EndUserOrders() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(currentPage));
        params.set('limit', String(itemsPerPage));
        if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
        if (searchTerm) params.set('q', searchTerm);
        const res = await fetch(`/api/enduser/orders?${params.toString()}`);
        const json = await res.json();
        if (json?.success) {
          const apiOrders = (json.data.orders || []).map((o: any) => ({
            id: o._id,
            customer: o.customerName,
            amount: o.totalPrice,
            status: (o.status === 'delivered' ? 'pickedup' : o.status) as any,
            invoiceStatus: 'to_invoice',
            orderDate: new Date(o.createdAt).toISOString().slice(0,10),
            pickupDate: o.pickupDate ? new Date(o.pickupDate).toLocaleDateString() : undefined,
            returnDate: o.returnDate ? new Date(o.returnDate).toLocaleDateString() : undefined,
            orderReference: o._id,
            createdBy: o.endUserId?.name || '—',
          }));
          setOrders(apiOrders);
        } else {
          toast.error('Failed to load orders');
        }
      } catch (e) {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, selectedStatus, searchTerm]);

  // Status counts
  const statusCounts = {
    ALL: orders.length,
    quotation: orders.filter(o => o.status === 'quotation').length,
    reserved: orders.filter(o => o.status === 'reserved').length,
    pickedup: orders.filter(o => o.status === 'pickedup').length,
    returned: orders.filter(o => o.status === 'returned').length,
  };

  const invoiceStatusCounts = {
    'fully_invoiced': orders.filter(o => o.invoiceStatus === 'fully_invoiced').length,
    'nothing_to_invoice': orders.filter(o => o.invoiceStatus === 'nothing_to_invoice').length,
    'to_invoice': orders.filter(o => o.invoiceStatus === 'to_invoice').length,
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles = {
      quotation: 'bg-blue-100 text-blue-800',
      quotation_sent: 'bg-purple-100 text-purple-800',
      reserved: 'bg-green-100 text-green-800',
      pickedup: 'bg-yellow-100 text-yellow-800',
      returned: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      quotation: 'Quotation',
      quotation_sent: 'Quotation Sent',
      reserved: 'Reserved',
      pickedup: 'Picked Up',
      returned: 'Returned'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/enduser/orders/create')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Rental Orders</h1>
              <Settings className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                />
              </div>

              {/* Pagination */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 ${viewMode === 'card' ? 'bg-primary-100 text-primary-800' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-800' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className="w-64 flex-shrink-0">
            {/* Rental Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">RENTAL STATUS</h3>
              <div className="space-y-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`w-full flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedStatus === status
                        ? 'bg-primary-100 text-primary-800'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span className="text-gray-500">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Invoice Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">INVOICE STATUS</h3>
              <div className="space-y-2">
                {Object.entries(invoiceStatusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setSelectedInvoiceStatus(status)}
                    className={`w-full flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedInvoiceStatus === status
                        ? 'bg-primary-100 text-primary-800'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span className="text-gray-500">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/enduser/orders/${order.id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.customer}</h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <IndianRupee className="w-3 h-3 mr-1" />
                          {order.amount}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-xs text-gray-500">
                        {order.id}
                      </div>
                      {getStatusBadge(order.status)}
                      {order.pickupDate && (
                        <div className="text-xs text-red-600">
                          Pickup: {order.pickupDate}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Created: {order.orderDate}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <span className="text-xl">«</span>
                    </button>
                    <h3 className="font-semibold text-gray-900">Rental Orders</h3>
                    <Settings className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created by user
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rental Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tax
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/enduser/orders/${order.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input type="checkbox" className="rounded border-gray-300" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.orderReference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center">
                            <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                            {order.createdBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            -
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right flex items-center justify-end">
                            <IndianRupee className="w-4 h-4 mr-1" />
                            {order.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Rental States</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">when rental is created</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">when it is sent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">when it confirmed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-600">when Rental Pickup is done</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">when rental Pickup is Returned</span>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Invoice state on rental order level</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Nothing to invoice</strong> - when order just created, and rental order is not confirmed</div>
              <div><strong>To invoice</strong> - rental order is confirmed but not create invoice</div>
              <div><strong>Fully invoiced</strong> - Invoice has been created for this rental order</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
