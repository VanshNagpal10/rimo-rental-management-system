/**
 * Enduser Reports API
 * Returns time-series revenue and orders grouped by day/week/month
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
    const { searchParams } = new URL(req.url);
    const groupBy = searchParams.get('groupBy') || 'day'; // day|week|month
    const range = parseInt(searchParams.get('range') || '90', 10); // in days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - range);

    const endUserId = new mongoose.Types.ObjectId(session.user.id);

    // Build group stage by bucket
    let groupId: any = {};
    if (groupBy === 'month') {
      groupId = { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } };
    } else if (groupBy === 'week') {
      groupId = { y: { $year: '$createdAt' }, w: { $isoWeek: '$createdAt' } };
    } else {
      groupId = { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } };
    }

    const rows = await RentalOrder.aggregate([
      { $match: { endUserId, createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $group: { _id: groupId, orders: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.w': 1, '_id.d': 1 } }
    ]);

    logger.http('GET /api/enduser/reports', { user: session.user.email, groupBy, points: rows.length });
    return NextResponse.json({ success: true, data: rows, meta: { groupBy, start, end } });
  } catch (error) {
    logger.error('enduser reports error', { error });
    return NextResponse.json({ success: false, error: 'Failed to load reports' }, { status: 500 });
  }
}


