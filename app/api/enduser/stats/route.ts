/**
 * Enduser Stats API
 * Computes business dashboard KPIs and leaderboards from live data.
 * - Auth: enduser only
 * - Source: RentalOrder + Product
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import RentalOrder from '@/models/RentalOrder';
import Product from '@/models/Product';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // Ensure only authenticated endusers can access
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'enduser') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Parse period in days (defaults 30)
    const { searchParams } = new URL(req.url);
    const periodDays = parseInt(searchParams.get('period') || '30', 10);
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - periodDays);

    const endUserId = session.user.id;

    // Parallel aggregations for performance
    const [
      quotationCount,
      rentalsCount,
      revenueAgg,
      topCategoriesAgg,
      topProductsAgg,
      topCustomersAgg
    ] = await Promise.all([
      // Quotations within period
      RentalOrder.countDocuments({ endUserId: new (require('mongoose').Types.ObjectId)(endUserId), status: 'quotation', createdAt: { $gte: start } }),

      // Active/confirmed rentals within period
      RentalOrder.countDocuments({
        endUserId: new (require('mongoose').Types.ObjectId)(endUserId),
        status: { $in: ['confirmed', 'reserved', 'delivered'] },
        createdAt: { $gte: start },
      }),

      // Revenue: sum totalPrice for monetized statuses
      RentalOrder.aggregate([
        { $match: { endUserId: new (require('mongoose').Types.ObjectId)(endUserId), createdAt: { $gte: start }, status: { $in: ['confirmed', 'delivered', 'returned'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),

      // Top Categories by order count and revenue
      RentalOrder.aggregate([
        { $match: { endUserId: new (require('mongoose').Types.ObjectId)(endUserId), createdAt: { $gte: start }, status: { $ne: 'cancelled' } } },
        { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $group: { _id: '$product.category', ordered: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { ordered: -1 } },
        { $limit: 5 }
      ]),

      // Top Products by orders and revenue
      RentalOrder.aggregate([
        { $match: { endUserId: new (require('mongoose').Types.ObjectId)(endUserId), createdAt: { $gte: start }, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$productId', ordered: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { product: '$product.name', ordered: 1, revenue: 1 } },
        { $sort: { ordered: -1 } },
        { $limit: 5 }
      ]),

      // Top Customers by orders and revenue
      RentalOrder.aggregate([
        { $match: { endUserId: new (require('mongoose').Types.ObjectId)(endUserId), createdAt: { $gte: start }, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$customerEmail', ordered: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $project: { customer: '$_id', _id: 0, ordered: 1, revenue: 1 } },
        { $sort: { ordered: -1 } },
        { $limit: 5 }
      ])
    ]);

    const payload = {
      quotations: quotationCount,
      rentals: rentalsCount,
      revenue: revenueAgg?.[0]?.total || 0,
      topCategories: topCategoriesAgg.map((c: any) => ({ category: c._id, ordered: c.ordered, revenue: c.revenue })),
      topProducts: topProductsAgg,
      topCustomers: topCustomersAgg,
    };

    logger.http('GET /api/enduser/stats', { user: session.user.email, periodDays, revenue: payload.revenue });
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    logger.error('enduser stats error', { error });
    return NextResponse.json({ success: false, error: 'Failed to load stats' }, { status: 500 });
  }
}


