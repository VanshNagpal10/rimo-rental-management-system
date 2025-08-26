/**
 * Home Page Component
 * Main landing page for customers to browse and rent products
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Package, 
  Star,
  MapPin,
  Clock,
  IndianRupee
} from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * Home Page Component
 */
export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect end users to their dashboard
  useEffect(() => {
    if (session?.user?.role === 'enduser') {
      router.push('/enduser');
    }
  }, [session, router]);

  // Mock categories for now
  const categories = [
    'All Categories',
    'Electronics',
    'Furniture', 
    'Vehicles',
    'Tools',
    'Sports',
    'Events',
    'Photography',
    'Other'
  ];

  // Mock products data for demo
  const mockProducts = [
    {
      id: '1',
      name: 'Professional Camera Kit',
      description: 'Complete DSLR camera kit with lenses and accessories',
      image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=200&fit=crop',
      category: 'Photography',
      pricePerDay: 500,
      pricePerHour: 75,
      availability: true,
      rating: 4.8,
      endUser: 'PhotoPro Rentals',
      location: 'Mumbai'
    },
    {
      id: '2', 
      name: 'Electric Drill Set',
      description: 'Heavy-duty electric drill with various bits and accessories',
      image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300&h=200&fit=crop',
      category: 'Tools',
      pricePerDay: 150,
      pricePerHour: 25,
      availability: true,
      rating: 4.6,
      endUser: 'ToolMaster',
      location: 'Delhi'
    },
    {
      id: '3',
      name: 'Camping Tent (4 Person)',
      description: 'Waterproof camping tent suitable for 4 people',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=300&h=200&fit=crop',
      category: 'Sports',
      pricePerDay: 200,
      pricePerHour: 30,
      availability: true,
      rating: 4.7,
      endUser: 'Adventure Gear',
      location: 'Bangalore'
    },
  ];

  useEffect(() => {
    // Simulate loading products
    setTimeout(() => {
      setProducts(mockProducts);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter products based on search and category
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           selectedCategory === 'All Categories' ||
                           product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Rent What You Need, When You Need It
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover thousands of products available for rent from trusted local businesses
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold text-gray-900">Available Products</h2>
            <span className="text-sm text-gray-500">
              {filteredProducts.length} items
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-800' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-800' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'product-grid' : 'space-y-4'}>
            {filteredProducts.map((product: any) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                viewMode={viewMode}
                onView={() => router.push(`/product/${product.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Product Card Component
 */
interface ProductCardProps {
  product: any;
  viewMode: 'grid' | 'list';
  onView: () => void;
}

function ProductCard({ product, viewMode, onView }: ProductCardProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          <div className="w-48 h-32 flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    {product.rating}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {product.location}
                  </div>
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-1" />
                    {product.endUser}
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-primary-800 flex items-center">
                  <IndianRupee className="w-4 h-4" />
                  {product.pricePerDay}
                  <span className="text-sm font-normal text-gray-500 ml-1">/day</span>
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <IndianRupee className="w-3 h-3" />
                  {product.pricePerHour}
                  <span className="ml-1">/hour</span>
                </div>
                <button
                  onClick={onView}
                  className="mt-2 btn btn-primary btn-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-card" onClick={onView}>
      <div className="aspect-video overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="badge badge-gray text-xs">{product.category}</span>
          <div className="flex items-center text-sm text-gray-500">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            {product.rating}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-500 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {product.location}
          </div>
          <div className="text-sm text-gray-500">{product.endUser}</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-primary-800 flex items-center">
              <IndianRupee className="w-4 h-4" />
              {product.pricePerDay}
              <span className="text-sm font-normal text-gray-500 ml-1">/day</span>
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <IndianRupee className="w-3 h-3" />
              {product.pricePerHour}
              <span className="ml-1">/hour</span>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="btn btn-primary btn-sm"
          >
            Rent Now
          </button>
        </div>
      </div>
    </div>
  );
}
