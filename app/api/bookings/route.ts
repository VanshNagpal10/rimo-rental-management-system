/**
 * Bookings API Route Handler
 * Handles CRUD operations for rental bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import RentalOrder from '@/models/RentalOrder';
import Product from '@/models/Product';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ApiResponse } from '@/types';

/**
 * GET /api/bookings
 * Fetch bookings with role-based filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required',
      };
      
      return NextResponse.json(response, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerEmail = searchParams.get('customerEmail');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query based on user role
    let query: any = {};

    // If customer, only show their bookings
    if (session.user.role === 'customer') {
      query.customerEmail = session.user.email;
    }

    // If enduser and customerEmail filter is provided
    if (session.user.role === 'enduser' && customerEmail) {
      query.customerEmail = customerEmail;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    // Execute query with pagination and populate product details
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate('productId', 'name image category pricePerDay')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    logger.http('GET /api/bookings', {
      user: session.user.email,
      role: session.user.role,
      count: bookings.length,
      totalCount,
      filters: { status, customerEmail, page, limit }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      message: `Found ${bookings.length} bookings`,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching bookings', { error });
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch bookings',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/bookings
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      productId,
      customerName,
      customerEmail,
      startDate,
      endDate,
      totalPrice,
    } = body;

    // Validate required fields
    if (!productId || !customerName || !customerEmail || !startDate || !endDate || !totalPrice) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields',
      };
      
      return NextResponse.json(response, { status: 400 });
    }

    // Validate product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found',
      };
      
      return NextResponse.json(response, { status: 404 });
    }

    if (!product.availability) {
      const response: ApiResponse = {
        success: false,
        error: 'Product is not available for booking',
      };
      
      return NextResponse.json(response, { status: 400 });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      const response: ApiResponse = {
        success: false,
        error: 'Start date cannot be in the past',
      };
      
      return NextResponse.json(response, { status: 400 });
    }

    if (end <= start) {
      const response: ApiResponse = {
        success: false,
        error: 'End date must be after start date',
      };
      
      return NextResponse.json(response, { status: 400 });
    }

    // Check availability for the requested dates
    const conflictingOrders = await RentalOrder.find({
      productId,
      status: { $in: ['confirmed', 'reserved', 'delivered'] },
      $or: [
        {
          startDate: { $lte: start },
          endDate: { $gt: start },
        },
        {
          startDate: { $lt: end },
          endDate: { $gte: end },
        },
        {
          startDate: { $gte: start },
          endDate: { $lte: end },
        },
      ],
    });

    if (conflictingOrders.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Product is not available for the selected dates',
      };
      
      return NextResponse.json(response, { status: 409 });
    }

    // Create new booking
    const booking = new Booking({
      productId,
      customerName,
      customerEmail,
      startDate: start,
      endDate: end,
      totalPrice: parseFloat(totalPrice),
      status: 'pending', // Default status
    });

    await booking.save();

    // Populate product details for response
    await booking.populate('productId', 'name image category');

    logger.booking('CREATE', booking._id.toString(), {
      product: product.name,
      customer: customerEmail,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalPrice,
    });

    const response: ApiResponse = {
      success: true,
      data: booking,
      message: 'Booking created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.error('Error creating booking', { error });
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to create booking',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
