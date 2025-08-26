/**
 * Statistics API Route Handler
 * Provides dashboard statistics and analytics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Product from '@/models/Product';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ApiResponse, DashboardStats } from '@/types';

/**
 * GET /api/stats
 * Get dashboard statistics (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'enduser') {
      logger.warn('Unauthorized stats access attempt', {
        user: session?.user?.email || 'unknown'
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
      
      return NextResponse.json(response, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // Default to 30 days

    // Date range for statistics
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Parallel execution of all statistics queries for better performance
    const [
      totalBookings,
      totalRevenue,
      activeRentals,
      lateReturns,
      monthlyRevenueData,
      popularProductsData,
      recentBookingsData,
    ] = await Promise.all([
      // Total bookings count
      Booking.countDocuments({ 
        status: { $ne: 'cancelled' },
        createdAt: { $gte: startDate }
      }),

      // Total revenue calculation
      Booking.aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'returned'] },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]),

      // Active rentals (confirmed status)
      Booking.countDocuments({
        status: 'confirmed',
        endDate: { $gte: new Date() }
      }),

      // Late returns
      Booking.countDocuments({
        status: 'confirmed',
        endDate: { $lt: new Date() }
      }),

      // Monthly revenue breakdown
      Booking.aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'returned'] },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$totalPrice' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]),

      // Most popular products
      Booking.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$productId',
            bookingCount: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $project: {
            productName: '$product.name',
            bookingCount: 1,
            revenue: 1
          }
        },
        {
          $sort: { bookingCount: -1 }
        },
        {
          $limit: 5
        }
      ]),

      // Recent bookings
      Booking.find({
        createdAt: { $gte: startDate }
      })
        .populate('productId', 'name image category')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Process monthly revenue data
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyRevenue = monthlyRevenueData.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue
    }));

    // Process popular products data
    const popularProducts = popularProductsData.map(item => ({
      productName: item.productName,
      bookingCount: item.bookingCount
    }));

    // Compile dashboard statistics
    const stats: DashboardStats = {
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      activeRentals,
      lateReturns,
      monthlyRevenue,
      popularProducts,
      recentBookings: recentBookingsData,
    };

    logger.http('GET /api/stats', {
      user: session.user.email,
      period,
      totalBookings,
      totalRevenue: stats.totalRevenue,
      activeRentals,
      lateReturns
    });

    const response: ApiResponse = {
      success: true,
      data: stats,
      message: `Statistics for the last ${period} days`,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching statistics', { error });
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch statistics',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * GET /api/stats/revenue
 * Get detailed revenue analytics (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'enduser') {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
      
      return NextResponse.json(response, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { startDate, endDate, groupBy = 'day' } = body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Build aggregation pipeline based on groupBy parameter
    let groupStage: any = {
      _id: null,
      revenue: { $sum: '$totalPrice' },
      bookingCount: { $sum: 1 }
    };

    switch (groupBy) {
      case 'day':
        groupStage._id = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupStage._id = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupStage._id = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }

    const revenueData = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'returned'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: groupStage
      },
      {
        $sort: groupBy === 'total' ? { revenue: -1 } : { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    logger.http('POST /api/stats/revenue', {
      user: session.user.email,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      groupBy,
      dataPoints: revenueData.length
    });

    const response: ApiResponse = {
      success: true,
      data: revenueData,
      message: `Revenue data grouped by ${groupBy}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching revenue analytics', { error });
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch revenue analytics',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
