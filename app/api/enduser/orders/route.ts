/**
 * Enduser Orders API
 * Returns paginated RentalOrder documents for the logged-in enduser with filters.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import RentalOrder from '@/models/RentalOrder';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'enduser') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '16', 10);
    const status = searchParams.get('status');
    const invoiceStatus = searchParams.get('invoice'); // placeholder
    const q = searchParams.get('q');

    const filter: any = { endUserId: new mongoose.Types.ObjectId(session.user.id) };
    if (status && status !== 'ALL') filter.status = status;
    if (q) filter.$or = [ { customerName: { $regex: q, $options: 'i' } }, { customerEmail: { $regex: q, $options: 'i' } } ];

    // DEBUG: Log query details
    console.log('=== ENDUSER ORDERS DEBUG ===');
    console.log('Session user:', { id: session.user.id, email: session.user.email, role: session.user.role });
    console.log('Filter:', filter);

    const skip = (page - 1) * limit;
    const [orders, totalCount] = await Promise.all([
      RentalOrder.find(filter)
        .populate('productId', 'name image category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RentalOrder.countDocuments(filter),
    ]);

    console.log('Found orders count:', orders.length);
    if (orders.length > 0) {
      console.log('Sample orders:', orders.slice(0, 2).map(o => ({
        id: o._id,
        endUserId: o.endUserId,
        customerId: o.customerId,
        customerName: o.customerName
      })));
    }

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        }
      }
    });
  } catch (error) {
    logger.error('enduser orders error', { error });
    return NextResponse.json({ success: false, error: 'Failed to load orders' }, { status: 500 });
  }
}


