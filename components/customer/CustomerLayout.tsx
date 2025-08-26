/**
 * Customer Layout Component
 * Shared layout for all customer pages with navigation, header, and footer
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  ShoppingBag, 
  Heart, 
  ShoppingCart, 
  User, 
  Menu, 
  X,
  Search,
  Grid3X3,
  List,
  Phone,
  ChevronDown
} from 'lucide-react';

interface CustomerLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSearch?: boolean;
  showViewToggle?: boolean;
  onViewChange?: (view: 'grid' | 'list') => void;
  currentView?: 'grid' | 'list';
}

export default function CustomerLayout({ 
  children, 
  title = 'Rental Shop',
  showSearch = false,
  showViewToggle = false,
  onViewChange,
  currentView = 'grid'
}: CustomerLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Navigation items
  const navItems = [
    { href: '/shop', label: 'Home', icon: Home },
    { href: '/shop', label: 'Rental Shop', icon: ShoppingBag },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/shop" className="text-2xl font-bold text-primary-800">
                RIMO
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right side - Cart and Profile */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link 
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-primary-800 transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-primary-800 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>

              {/* Contact Us */}
              <Link 
                href="/contact"
                className="hidden md:flex items-center space-x-2 bg-primary-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Contact us</span>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-800 transition-colors"
                >
                  <User className="h-6 w-6" />
                  <span className="hidden md:block text-sm font-medium">
                    {session?.user?.name || 'adam'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-primary-800 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar and View Toggle */}
          {(showSearch || showViewToggle) && (
            <div className="py-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'].map((category) => (
                  <button
                    key={category}
                    className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Search and Controls */}
              <div className="flex items-center space-x-4">
                {/* Price List Dropdown */}
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Price List</option>
                  <option>Low to High</option>
                  <option>High to Low</option>
                </select>

                {/* Search */}
                {showSearch && (
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </form>
                )}

                {/* Sort */}
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Sort by</option>
                  <option>Name A-Z</option>
                  <option>Name Z-A</option>
                  <option>Price Low-High</option>
                  <option>Price High-Low</option>
                </select>

                {/* View Toggle */}
                {showViewToggle && onViewChange && (
                  <div className="flex border border-gray-300 rounded-md overflow-hidden">
                    <button
                      onClick={() => onViewChange('grid')}
                      className={`p-2 ${currentView === 'grid' 
                        ? 'bg-primary-800 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onViewChange('list')}
                      className={`p-2 ${currentView === 'list' 
                        ? 'bg-primary-800 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <Link
                href="/contact"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Phone className="h-4 w-4" />
                <span>Contact us</span>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1">
          <Link
            href="/shop"
            className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-primary-800"
          >
            <Home className="h-5 w-5 mb-1" />
            <span>Home</span>
          </Link>
          <Link
            href="/shop"
            className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-primary-800"
          >
            <ShoppingBag className="h-5 w-5 mb-1" />
            <span>Shop</span>
          </Link>
          <Link
            href="/cart"
            className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-primary-800 relative"
          >
            <ShoppingCart className="h-5 w-5 mb-1" />
            <span>Cart</span>
            <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-primary-800 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              0
            </span>
          </Link>
          <Link
            href="/wishlist"
            className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-primary-800"
          >
            <Heart className="h-5 w-5 mb-1" />
            <span>Wishlist</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-primary-800"
          >
            <User className="h-5 w-5 mb-1" />
            <span>Profile</span>
          </Link>
        </div>
      </div>

      {/* Add padding to prevent content being hidden behind mobile navigation */}
      <div className="md:hidden h-16"></div>
    </div>
  );
}
