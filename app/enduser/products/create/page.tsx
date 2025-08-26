/**
 * Product Create Page
 * Form for creating new rental products
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Settings,
  ChevronLeft,
  ChevronRight,
  Upload,
  Save,
  X,
  Plus,
  Minus,
  IndianRupee,
  Package,
  Info
} from 'lucide-react';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  image: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek: number;
  pricePerMonth: number;
  pricePerYear: number;
  quantityAvailable: number;
  units: string[];
  extraCharges: {
    extraHour: number;
    extraDay: number;
  };
}

export default function CreateProduct() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    image: '',
    pricePerHour: 0,
    pricePerDay: 0,
    pricePerWeek: 0,
    pricePerMonth: 0,
    pricePerYear: 0,
    quantityAvailable: 1,
    units: ['day'],
    extraCharges: {
      extraHour: 0,
      extraDay: 0,
    }
  });

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Categories for dropdown
  const categories = [
    'Photography',
    'Tools',
    'Sports',
    'Electronics',
    'Furniture',
    'Equipment',
    'Vehicles',
    'Other'
  ];

  // Units for rental periods
  const availableUnits = [
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' }
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProductFormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const toggleUnit = (unit: string) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.includes(unit)
        ? prev.units.filter(u => u !== unit)
        : [...prev.units, unit]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setImageUploading(true);
    
    try {
      // Convert image to base64 for now (in production, you'd upload to cloud storage)
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        handleInputChange('image', base64String);
        toast.success('Image uploaded successfully');
        setImageUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to upload image');
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication
    if (!session?.user) {
      toast.error('Please log in to create products');
      router.push('/login');
      return;
    }

    // Check if user is end user
    if (session.user.role !== 'enduser') {
      toast.error('Only business owners can create products');
      return;
    }

    // Validate form
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    if (formData.units.length === 0) {
      toast.error('Please select at least one rental period');
      return;
    }

    // Validate pricing for selected units
    for (const unit of formData.units) {
      const priceKey = `pricePer${unit.charAt(0).toUpperCase() + unit.slice(1)}` as keyof ProductFormData;
      if (!formData[priceKey] || (formData[priceKey] as number) <= 0) {
        toast.error(`Please set a price for ${unit} rental`);
        return;
      }
    }

    setLoading(true);

    try {
      // Prepare data for API
      const productData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        image: formData.image || '/placeholder-product.jpg',
        quantityAvailable: formData.quantityAvailable,
        units: formData.units[0], // Primary unit for the product
        availability: true,
      };

      // Only include prices for selected units
      if (formData.units.includes('hour') && formData.pricePerHour > 0) {
        productData.pricePerHour = formData.pricePerHour;
      }
      if (formData.units.includes('day') && formData.pricePerDay > 0) {
        productData.pricePerDay = formData.pricePerDay;
      }
      if (formData.units.includes('week') && formData.pricePerWeek > 0) {
        productData.pricePerWeek = formData.pricePerWeek;
      }
      if (formData.units.includes('month') && formData.pricePerMonth > 0) {
        productData.pricePerMonth = formData.pricePerMonth;
      }
      if (formData.units.includes('year') && formData.pricePerYear > 0) {
        productData.pricePerYear = formData.pricePerYear;
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Product created successfully!');
        router.push('/enduser/products');
      } else {
        console.error('API Error:', result);
        toast.error(result.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-xl font-semibold text-gray-900">Product</h1>
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
              <button
                type="button"
                onClick={() => router.push('/enduser/products')}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>

            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="product-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - General Product Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">General Product Info</h3>
              
              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter product name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter product description"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Available */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Available *
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('quantityAvailable', Math.max(0, formData.quantityAvailable - 1))}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantityAvailable}
                      onChange={(e) => handleInputChange('quantityAvailable', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('quantityAvailable', formData.quantityAvailable + 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                  >
                    {imageUploading ? (
                      <div className="space-y-2">
                        <div className="loading-spinner mx-auto"></div>
                        <p className="text-sm text-blue-600">Uploading image...</p>
                      </div>
                    ) : formData.image ? (
                      <div className="space-y-2">
                        <img 
                          src={formData.image} 
                          alt="Preview" 
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <p className="text-sm text-green-600">Image uploaded successfully</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInputChange('image', '');
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove image
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </>
                    )}
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Rental Pricing */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Rental Pricing</h3>
              
              <div className="space-y-6">
                {/* Rental Period Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Rental Periods *
                  </label>
                  <div className="space-y-2">
                    {availableUnits.map((unit) => (
                      <label key={unit.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.units.includes(unit.value)}
                          onChange={() => toggleUnit(unit.value)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{unit.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pricing Table */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pricing per Period
                  </label>
                  <div className="space-y-4">
                    {formData.units.includes('hour') && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-20">Per Hour:</span>
                        <div className="flex items-center">
                          <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.pricePerHour}
                            onChange={(e) => handleInputChange('pricePerHour', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}

                    {formData.units.includes('day') && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-20">Per Day:</span>
                        <div className="flex items-center">
                          <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.pricePerDay}
                            onChange={(e) => handleInputChange('pricePerDay', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}

                    {formData.units.includes('week') && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-20">Per Week:</span>
                        <div className="flex items-center">
                          <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.pricePerWeek}
                            onChange={(e) => handleInputChange('pricePerWeek', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}

                    {formData.units.includes('month') && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-20">Per Month:</span>
                        <div className="flex items-center">
                          <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.pricePerMonth}
                            onChange={(e) => handleInputChange('pricePerMonth', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}

                    {formData.units.includes('year') && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-20">Per Year:</span>
                        <div className="flex items-center">
                          <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.pricePerYear}
                            onChange={(e) => handleInputChange('pricePerYear', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extra Charges */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rental Reservations Charges
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Extra Hour:</span>
                      <div className="flex items-center">
                        <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.extraCharges.extraHour}
                          onChange={(e) => handleInputChange('extraCharges.extraHour', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Extra Day:</span>
                      <div className="flex items-center">
                        <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.extraCharges.extraDay}
                          onChange={(e) => handleInputChange('extraCharges.extraDay', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Help Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Pricing Tips:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Select at least one rental period</li>
                        <li>Extra charges apply when rentals exceed the paid period</li>
                        <li>Weekly/Monthly rates typically offer discounts over daily rates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
