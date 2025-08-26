/**
 * Enduser Customers API
 * Returns aggregated customers with totals for orders and spend for the logged-in enduser.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import RentalOrder from '@/models/RentalOrder';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'enduser') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const endUserId = new mongoose.Types.ObjectId(session.user.id);
    const agg = await RentalOrder.aggregate([
      { $match: { endUserId, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$customerEmail', name: { $first: '$customerName' }, totalOrders: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' }, lastOrder: { $max: '$createdAt' } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 200 }
    ]);

    const customers = agg.map(c => ({
      id: c._id,
      name: c.name || c._id,
      email: c._id,
      phone: '',
      address: '',
      joinDate: c.lastOrder,
      totalOrders: c.totalOrders,
      totalSpent: c.totalSpent,
      lastOrder: c.lastOrder,
    }));

    logger.http('GET /api/enduser/customers', { count: customers.length, user: session.user.email });
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    logger.error('enduser customers error', { error });
    return NextResponse.json({ success: false, error: 'Failed to load customers' }, { status: 500 });
  }
}


