/**
 * Product Edit Page (End User)
 * Allows business owners to update an existing product's core details and pricing
 * - Fetches product by `id` and pre-fills the form
 * - Validates that at least one price > 0
 * - Submits updates via PUT /api/products/[id]
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  IndianRupee,
  Package,
  Info,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

/** Product form shape used locally on the client */
interface ProductFormData {
  name: string;
  description: string;
  category: string;
  image: string;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  pricePerYear?: number;
  quantityAvailable: number;
  units: string[]; // Available rental periods chosen (first one will be primary)
  availability: boolean;
}

export default function EditProductPage() {
  /** Router, params, auth */
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const { data: session, status } = useSession();

  /** UI State */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  /** Form State */
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    image: '',
    pricePerHour: undefined,
    pricePerDay: undefined,
    pricePerWeek: undefined,
    pricePerMonth: undefined,
    pricePerYear: undefined,
    quantityAvailable: 1,
    units: ['day'],
    availability: true,
  });

  /** Static options */
  const categories = useMemo(
    () => [
      'Photography',
      'Tools',
      'Sports',
      'Electronics',
      'Furniture',
      'Equipment',
      'Vehicles',
      'Other',
    ],
    []
  );

  const availableUnits = useMemo(
    () => [
      { value: 'hour', label: 'Hour' },
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'year', label: 'Year' },
    ],
    []
  );

  /** Guard: Only end users */
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/login');
      return;
    }
    if (session.user.role !== 'enduser') {
      router.push('/');
    }
  }, [session, status, router]);

  /** Fetch product and prefill */
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${productId}`);
        const json = await res.json();
        if (!json?.success) {
          toast.error(json?.error || 'Failed to load product');
          router.push('/enduser/products');
          return;
        }

        const p = json.data;
        // Build units array from existing prices; ensure current primary unit first
        const unitsFromPrices: string[] = [];
        if (p.pricePerHour && p.pricePerHour > 0) unitsFromPrices.push('hour');
        if (p.pricePerDay && p.pricePerDay > 0) unitsFromPrices.push('day');
        if (p.pricePerWeek && p.pricePerWeek > 0) unitsFromPrices.push('week');
        if (p.pricePerMonth && p.pricePerMonth > 0) unitsFromPrices.push('month');
        if (p.pricePerYear && p.pricePerYear > 0) unitsFromPrices.push('year');
        const dedupUnits = Array.from(new Set([p.units, ...unitsFromPrices].filter(Boolean)));

        setFormData({
          name: p.name || '',
          description: p.description || '',
          category: p.category || '',
          image: p.image || '/placeholder-product.jpg',
          pricePerHour: p.pricePerHour ?? undefined,
          pricePerDay: p.pricePerDay ?? undefined,
          pricePerWeek: p.pricePerWeek ?? undefined,
          pricePerMonth: p.pricePerMonth ?? undefined,
          pricePerYear: p.pricePerYear ?? undefined,
          quantityAvailable: p.quantityAvailable ?? 1,
          units: dedupUnits.length > 0 ? dedupUnits : ['day'],
          availability: Boolean(p.availability),
        });
      } catch (e) {
        toast.error('Failed to load product');
        router.push('/enduser/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, router]);

  /** Helpers */
  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleUnit = (unit: string) => {
    setFormData((prev) => ({
      ...prev,
      units: prev.units.includes(unit)
        ? prev.units.filter((u) => u !== unit)
        : [...prev.units, unit],
    }));
  };

  /** Image upload -> base64 (temporary placeholder) */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        handleInputChange('image', reader.result as string);
        setImageUploading(false);
        toast.success('Image uploaded');
      };
      reader.onerror = () => {
        setImageUploading(false);
        toast.error('Failed to upload image');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setImageUploading(false);
      toast.error('Failed to upload image');
    }
  };

  /** Validate & Submit */
  const validate = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return false;
    }
    if (formData.units.length === 0) {
      toast.error('Please select at least one rental period');
      return false;
    }
    const hasPrice = [
      formData.pricePerHour,
      formData.pricePerDay,
      formData.pricePerWeek,
      formData.pricePerMonth,
      formData.pricePerYear,
    ].some((v) => typeof v === 'number' && Number(v) > 0);
    if (!hasPrice) {
      toast.error('At least one price must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      // Build update payload: send only meaningful fields
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        image: formData.image || '/placeholder-product.jpg',
        quantityAvailable: formData.quantityAvailable,
        availability: formData.availability,
        units: formData.units[0], // Primary unit
      };
      if (formData.pricePerHour && formData.pricePerHour > 0) payload.pricePerHour = formData.pricePerHour;
      if (formData.pricePerDay && formData.pricePerDay > 0) payload.pricePerDay = formData.pricePerDay;
      if (formData.pricePerWeek && formData.pricePerWeek > 0) payload.pricePerWeek = formData.pricePerWeek;
      if (formData.pricePerMonth && formData.pricePerMonth > 0) payload.pricePerMonth = formData.pricePerMonth;
      if (formData.pricePerYear && formData.pricePerYear > 0) payload.pricePerYear = formData.pricePerYear;

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Failed to update product');
        return;
      }
      toast.success('Product updated');
      router.push('/enduser/products');
    } catch (err) {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  /** Loading state */
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading-spinner" />
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
              <h1 className="text-xl font-semibold text-gray-900">Edit Product</h1>
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
              form="product-edit-form"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="product-edit-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - General Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">General Product Info</h3>

              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity Available */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Available *</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={0}
                      value={formData.quantityAvailable}
                      onChange={(e) => handleInputChange('quantityAvailable', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('availability', !formData.availability)}
                      className="text-gray-600 hover:text-gray-800"
                      title={formData.availability ? 'Disable product' : 'Enable product'}
                    >
                      {formData.availability ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                  >
                    {imageUploading ? (
                      <div className="space-y-2">
                        <div className="loading-spinner mx-auto" />
                        <p className="text-sm text-blue-600">Uploading image...</p>
                      </div>
                    ) : formData.image ? (
                      <div className="space-y-2">
                        <img src={formData.image} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-lg" />
                        <p className="text-sm text-green-600">Image selected</p>
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
                        <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                    <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Pricing */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Rental Pricing</h3>
              <div className="space-y-6">
                {/* Rental Period Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Available Rental Periods *</label>
                  <div className="space-y-2">
                    {availableUnits.map((u) => (
                      <label key={u.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.units.includes(u.value)}
                          onChange={() => toggleUnit(u.value)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{u.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pricing Table */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Pricing per Period</label>
                  <div className="space-y-4">
                    {formData.units.includes('hour') && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-20">Per Hour:</span>
                        <div className="flex items-center">
                          <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={formData.pricePerHour ?? 0}
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
                            min={0}
                            step="0.01"
                            value={formData.pricePerDay ?? 0}
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
                            min={0}
                            step="0.01"
                            value={formData.pricePerWeek ?? 0}
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
                            min={0}
                            step="0.01"
                            value={formData.pricePerMonth ?? 0}
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
                            min={0}
                            step="0.01"
                            value={formData.pricePerYear ?? 0}
                            onChange={(e) => handleInputChange('pricePerYear', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Help Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Pricing guidance:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Keep at least one rental period active with a positive price</li>
                        <li>The first selected period becomes the product's primary unit</li>
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


