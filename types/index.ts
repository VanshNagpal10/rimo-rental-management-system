/**
 * TypeScript Type Definitions
 * Centralized type definitions for the rental management application
 */

import { Document, Types } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: 'enduser' | 'customer';
  phone?: string;
  address?: string;
  companyName?: string; // For end users
  businessType?: string; // For end users
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  image: string;
  category: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek: number;
  pricePerMonth: number;
  pricePerYear: number;
  availability: boolean;
  endUserId: Types.ObjectId; // Owner of the product
  units: 'hour' | 'day' | 'week' | 'month' | 'year';
  quantityAvailable: number;
  createdAt: Date;
  updatedAt: Date;
}

// Booking Types
export interface IBooking extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  product?: IProduct; // Populated product details
  customerName: string;
  customerEmail: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'returned' | 'late' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Frontend-safe versions (without mongoose-specific fields)
export interface Product {
  _id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek: number;
  availability: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  productId: string;
  product?: Product;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'returned' | 'late' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'customer' | 'enduser';
  phone?: string;
  address?: string;
  companyName?: string;
  businessType?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Booking Form Types
export interface BookingFormData {
  productId: string;
  customerName: string;
  customerEmail: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
}

// Product Form Types
export interface ProductFormData {
  name: string;
  description: string;
  image: string;
  category: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek: number;
  availability: boolean;
}

// Dashboard Statistics Types
export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  activeRentals: number;
  lateReturns: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  popularProducts: Array<{
    productName: string;
    bookingCount: number;
  }>;
  recentBookings: Booking[];
}

// Price Calculation Types
export interface PriceCalculation {
  days: number;
  weeks: number;
  hours: number;
  totalPrice: number;
  breakdown: {
    weekPrice: number;
    dayPrice: number;
    hourPrice: number;
  };
}

// Filter and Pagination Types
export interface BookingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  customerEmail?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Payment Types
export interface PaymentData {
  bookingId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Chart Data Types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface RevenueChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }>;
}

// NextAuth Types Extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'customer' | 'enduser';
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'enduser';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'customer' | 'enduser';
  }
}
