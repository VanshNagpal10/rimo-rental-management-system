/**
 * End User Dashboard Page
 * Main dashboard for business owners with KPIs, analytics, and management overview
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Package,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Search,
  ChevronDown,
  IndianRupee
} from 'lucide-react';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

/**
 * Dashboard Main Page Component
 */
export default function EndUserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 days');
  const [dashboardData, setDashboardData] = useState({
    quotations: 0,
    rentals: 0,
    revenue: 0,
    topCategories: [] as Array<{ category: string; ordered: number; revenue: number }>,
    topProducts: [] as Array<{ product: string; ordered: number; revenue: number }>,
    topCustomers: [] as Array<{ customer: string; ordered: number; revenue: number }>,
  });

  // Redirect non-end users
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'enduser') {
      router.push('/');
      return;
    }
    // Fetch live stats for enduser
    const load = async () => {
      try {
        const periodMap: any = { 'Last 7 days': 7, 'Last 30 days': 30, 'Last 90 days': 90, 'Last 6 months': 180, 'Last year': 365 };
        const days = periodMap[selectedPeriod] || 30;
        const res = await fetch(`/api/enduser/stats?period=${days}`);
        const json = await res.json();
        if (json?.success) {
          setDashboardData(json.data);
        } else {
          toast.error('Failed to load dashboard');
        }
      } catch (e) {
        toast.error('Failed to load dashboard');
      }
    };
    load();
  }, [session, status, router, selectedPeriod]);

  // Period options for dropdown
  const periodOptions = [
    'Last 7 days',
    'Last 30 days', 
    'Last 90 days',
    'Last 6 months',
    'Last year',
    'Custom range'
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'enduser') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {session.user.name}</p>
            </div>
            
            {/* Search and Period Selector */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                />
              </div>
              
              {/* Period Dropdown */}
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {periodOptions.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quotations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Quotations
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardData.quotations}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Rentals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Rentals
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardData.rentals}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Revenue
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2 flex items-center">
                  <IndianRupee className="h-6 w-6 mr-1" />
                  {dashboardData.revenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Product Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Product Categories</h3>
            </div>
            <div className="p-6">
              <div className="overflow-hidden">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Category
                      </th>
                      <th className="text-center py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Ordered
                      </th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.topCategories.map((item, index) => (
                      <tr key={index}>
                        <td className="py-4 text-sm font-medium text-gray-900">
                          {item.category}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-center">
                          {item.ordered}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-right flex items-center justify-end">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {item.revenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            </div>
            <div className="p-6">
              <div className="overflow-hidden">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Product
                      </th>
                      <th className="text-center py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Ordered
                      </th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.topProducts.map((item, index) => (
                      <tr key={index}>
                        <td className="py-4 text-sm font-medium text-gray-900">
                          {item.product}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-center">
                          {item.ordered}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-right flex items-center justify-end">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {item.revenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
            </div>
            <div className="p-6">
              <div className="overflow-hidden">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Customer
                      </th>
                      <th className="text-center py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Ordered
                      </th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.topCustomers.map((item, index) => (
                      <tr key={index}>
                        <td className="py-4 text-sm font-medium text-gray-900">
                          {item.customer}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-center">
                          {item.ordered}
                        </td>
                        <td className="py-4 text-sm text-gray-600 text-right flex items-center justify-end">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {item.revenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/enduser/orders')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <Calendar className="h-8 w-8 text-primary-800 mb-3" />
            <h3 className="font-semibold text-gray-900">Manage Orders</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage all rental orders</p>
          </button>

          <button
            onClick={() => router.push('/enduser/products')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <Package className="h-8 w-8 text-primary-800 mb-3" />
            <h3 className="font-semibold text-gray-900">Products</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your product inventory</p>
          </button>

          <button
            onClick={() => router.push('/enduser/customers')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <Users className="h-8 w-8 text-primary-800 mb-3" />
            <h3 className="font-semibold text-gray-900">Customers</h3>
            <p className="text-sm text-gray-600 mt-1">View customer information</p>
          </button>

          <button
            onClick={() => router.push('/enduser/reports')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <BarChart3 className="h-8 w-8 text-primary-800 mb-3" />
            <h3 className="font-semibold text-gray-900">Reports</h3>
            <p className="text-sm text-gray-600 mt-1">View detailed analytics</p>
          </button>
        </div>
      </div>
    </div>
  );
}
