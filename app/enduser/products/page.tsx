/**
 * End User Products Management Page
 * Product inventory management for business owners
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Plus,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Copy,
  Package,
  IndianRupee,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  pricePerYear?: number;
  availability: boolean;
  quantityAvailable: number;
  units: string;
  endUserId: {
    _id: string;
    name: string;
    companyName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function EndUserProducts() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 12;

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch only the business owner's products
      const response = await fetch('/api/products?myProducts=true');
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data);
      } else {
        toast.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        fetchProducts(); // Refresh the list
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Toggle product availability
  const handleToggleAvailability = async (productId: string, currentAvailability: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability: !currentAvailability,
        }),
      });

      if (response.ok) {
        toast.success(`Product ${!currentAvailability ? 'enabled' : 'disabled'} successfully`);
        fetchProducts(); // Refresh the list
      } else {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        toast.error(errorData.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  // Redirect if not authenticated or not end user
  useEffect(() => {
    if (session === null) {
      router.push('/login');
    } else if (session?.user?.role !== 'enduser') {
      router.push('/');
    }
  }, [session, router]);



  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Use the real API functions instead of local state manipulation

  const handleStockUpdate = (productId: string) => {
    // Navigate to stock update page
    router.push(`/enduser/products/${productId}/stock`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/enduser/products/create')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Products</h1>
              <Settings className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                />
              </div>

              {/* Pagination */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner"></div>
            <span className="ml-3 text-gray-600">Loading products...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="relative aspect-video">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button 
                    onClick={() => router.push(`/enduser/products/${product._id}`)}
                    className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => router.push(`/enduser/products/${product._id}/edit`)}
                    className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                {!product.availability && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {product.category}
                  </span>
                  <button
                    onClick={() => handleToggleAvailability(product._id, product.availability)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {product.availability ? (
                      <ToggleRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>

                {/* Availability Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    Stock: {product.quantityAvailable}
                  </span>
                  <button
                    onClick={() => handleStockUpdate(product._id)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Update Stock
                  </button>
                </div>

                {/* Pricing Grid */}
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Rental Pricing</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {product.pricePerHour && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hour:</span>
                        <span className="font-medium flex items-center">
                          <IndianRupee className="w-3 h-3 mr-0.5" />
                          {product.pricePerHour}
                        </span>
                      </div>
                    )}
                    {product.pricePerDay && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Day:</span>
                        <span className="font-medium flex items-center">
                          <IndianRupee className="w-3 h-3 mr-0.5" />
                          {product.pricePerDay}
                        </span>
                      </div>
                    )}
                    {product.pricePerWeek && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Week:</span>
                        <span className="font-medium flex items-center">
                          <IndianRupee className="w-3 h-3 mr-0.5" />
                          {product.pricePerWeek}
                        </span>
                      </div>
                    )}
                    {product.pricePerMonth && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Month:</span>
                        <span className="font-medium flex items-center">
                          <IndianRupee className="w-3 h-3 mr-0.5" />
                          {product.pricePerMonth}
                        </span>
                      </div>
                    )}
                    {product.pricePerYear && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year:</span>
                        <span className="font-medium flex items-center">
                          <IndianRupee className="w-3 h-3 mr-0.5" />
                          {product.pricePerYear}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Unit */}
                <div className="mb-4">
                  <span className="text-xs text-gray-600">Primary Unit: </span>
                  <span className="text-xs font-medium text-gray-900 capitalize">{product.units}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="flex items-center text-xs text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                  <button
                    onClick={() => router.push(`/enduser/products/${product._id}/edit`)}
                    className="px-3 py-1 bg-primary-800 text-white text-xs rounded hover:bg-primary-700 transition-colors"
                  >
                    Edit Product
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first product'}
            </p>
            <button
              onClick={() => router.push('/enduser/products/create')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </button>
          </div>
        )}

        {/* Bulk Actions */}
        {filteredProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Edit className="w-4 h-4 mr-2" />
                Update Selected
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Package className="w-4 h-4 mr-2" />
                Update Stock
              </button>
              <button className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
