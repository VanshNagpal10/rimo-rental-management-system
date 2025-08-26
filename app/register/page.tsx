/**
 * Registration Page Component
 * Provides user registration for both End Users and Customers
 * with role-specific form fields and validation
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, 
  EyeOff, 
  Package, 
  Mail, 
  Lock, 
  User as UserIcon,
  Phone,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { getSession } from 'next-auth/react';

/**
 * Registration Page Component
 */
export default function RegisterPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'enduser'>('customer');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    // End user specific fields
    companyName: '',
    businessType: '',
  });

  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      if (session?.user) {
        // Redirect based on user role
        if (session.user.role === 'enduser') {
          router.push('/enduser');
        } else {
          router.push('/');
        }
      }
    };
    checkAuth();
  }, [router]);

  // Business type options for end users
  const businessTypes = [
    'Equipment Rental',
    'Tool Rental',
    'Vehicle Rental',
    'Event Rental',
    'Photography Equipment',
    'Construction Equipment',
    'Medical Equipment',
    'Other'
  ];

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle role change
  const handleRoleChange = (role: 'customer' | 'enduser') => {
    setSelectedRole(role);
    // Clear role-specific errors
    setErrors(prev => ({
      ...prev,
      companyName: '',
      businessType: ''
    }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Common validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // End user specific validation
    if (selectedRole === 'enduser') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required for business accounts';
      }

      if (!formData.businessType) {
        newErrors.businessType = 'Business type is required for business accounts';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        password: formData.password,
        role: selectedRole,
        ...(selectedRole === 'enduser' && {
          companyName: formData.companyName,
          businessType: formData.businessType,
        }),
      };

      logger.auth('Registration attempt', formData.email, { role: selectedRole });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Your account has been created. Please sign in.');
        logger.auth('Registration successful', formData.email, { role: selectedRole });
        router.push('/login');
      } else {
        setErrors({
          general: result.error || 'Registration failed. Please try again.',
        });
        toast.error(result.error || 'Registration failed. Please try again.');
        logger.auth('Registration failed', formData.email, { error: result.error });
      }
    } catch (error) {
      logger.error('Registration error', { error, email: formData.email });
      setErrors({
        general: 'Something went wrong. Please try again.',
      });
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Title */}
        <div className="flex justify-center">
          <div className="flex items-center">
            <Package className="w-12 h-12 text-primary-800 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RIMO</h1>
              <p className="text-sm text-gray-600">Rental Management</p>
            </div>
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join RIMO and start managing rentals today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          {/* Role Selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">I want to:</p>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('customer')}
                className={`
                  flex items-center px-4 py-3 border rounded-lg font-medium transition-colors
                  ${selectedRole === 'customer'
                    ? 'border-primary-800 bg-primary-50 text-primary-800'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <UserIcon className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="text-sm font-medium">Rent Products</div>
                  <div className="text-xs text-gray-500">Browse and rent items from businesses</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('enduser')}
                className={`
                  flex items-center px-4 py-3 border rounded-lg font-medium transition-colors
                  ${selectedRole === 'enduser'
                    ? 'border-primary-800 bg-primary-50 text-primary-800'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Building2 className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="text-sm font-medium">Rent Out My Products</div>
                  <div className="text-xs text-gray-500">Manage my rental business and products</div>
                </div>
              </button>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error Message */}
            {errors.general && (
              <div className="alert alert-danger">
                <AlertCircle className="w-5 h-5 mr-2" />
                {errors.general}
              </div>
            )}

            {/* Name Field */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input pl-10 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            {/* Phone Field */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`form-input pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>

            {/* Address Field */}
            <div className="form-group">
              <label htmlFor="address" className="form-label">
                Address <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  autoComplete="address-line1"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            {/* End User Specific Fields */}
            {selectedRole === 'enduser' && (
              <>
                {/* Company Name */}
                <div className="form-group">
                  <label htmlFor="companyName" className="form-label">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required={selectedRole === 'enduser'}
                      value={formData.companyName}
                      onChange={handleChange}
                      className={`form-input pl-10 ${errors.companyName ? 'border-red-500' : ''}`}
                      placeholder="Enter your company name"
                    />
                  </div>
                  {errors.companyName && <p className="form-error">{errors.companyName}</p>}
                </div>

                {/* Business Type */}
                <div className="form-group">
                  <label htmlFor="businessType" className="form-label">
                    Business Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="businessType"
                      name="businessType"
                      required={selectedRole === 'enduser'}
                      value={formData.businessType}
                      onChange={handleChange}
                      className={`form-select pl-10 ${errors.businessType ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select business type</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.businessType && <p className="form-error">{errors.businessType}</p>}
                </div>
              </>
            )}

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-800 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary-800 hover:text-primary-700 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Additional Information */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary-800 hover:text-primary-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-800 hover:text-primary-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
