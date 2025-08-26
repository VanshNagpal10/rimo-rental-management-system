/**
 * Order Completion API
 * Consumes inventory for purchased items, flips availability when stock is 0,
 * and optionally creates RentalOrder documents for each cart line.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import RentalOrder from '@/models/RentalOrder';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const items: Array<{ productId: string; quantity: number; startDate?: string; endDate?: string; durationUnit?: string; pricePerUnit?: number; totalPrice?: number; deliveryAddress?: any; endUserId?: string; }>
      = Array.isArray(body?.items) ? body.items : [];
    const customer = body?.customer || {};



    if (items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items' }, { status: 400 });
    }

    // Dev-friendly stock deductions without MongoDB transactions (standalone MongoDB doesn't support them)
    const updated: any[] = [];

    try {
      for (const it of items) {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const product = await Product.findById(it.productId);
        if (!product) {
          throw new Error('Product not found');
        }
        if (product.quantityAvailable < qty) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        // Update inventory
        product.quantityAvailable = product.quantityAvailable - qty;
        if (product.quantityAvailable <= 0) {
          product.quantityAvailable = 0;
          product.availability = false;
        }
        await product.save();
        updated.push({ productId: product._id.toString(), quantityAvailable: product.quantityAvailable, availability: product.availability });

        // Create RentalOrder snapshot (non-blocking)
        try {
          // Ensure dates are in the future to avoid validation issues
          const now = new Date();
          const defaultStart = new Date(now.getTime() + 24*60*60*1000); // Tomorrow
          const defaultEnd = new Date(now.getTime() + 48*60*60*1000); // Day after tomorrow
          
          const start = it.startDate ? new Date(it.startDate) : defaultStart;
          const end = it.endDate ? new Date(it.endDate) : defaultEnd;
          
          // If start date is in the past, push it to tomorrow
          if (start < now) {
            start.setTime(defaultStart.getTime());
          }
          
          // Ensure end date is after start date
          if (end <= start) {
            end.setTime(start.getTime() + 24*60*60*1000);
          }

          // Prefer product.endUserId from DB to avoid client-side type issues (e.g., "[object Object]")
          const endUserIdFromProduct: any = (product as any).endUserId;
          const phone = customer.phone || (it as any)?.deliveryAddress?.phone || '';

          const orderData = {
            productId: product._id,
            customerId: new mongoose.Types.ObjectId(session.user.id),
            endUserId: endUserIdFromProduct,
            customerName: customer.name || session.user.name,
            customerEmail: customer.email || session.user.email,
            customerPhone: phone.trim() ? phone.trim() : undefined,
            startDate: start,
            endDate: end,
            duration: 1,
            durationUnit: (it.durationUnit || 'day') as any,
            totalPrice: Number(it.totalPrice || it.pricePerUnit || 0),
            status: 'confirmed',
            paymentStatus: 'paid',
            deliveryAddress: JSON.stringify((it as any)?.deliveryAddress || {}),
          } as any;

          const rentalOrder = await RentalOrder.create([orderData]);
        } catch (e) {
          // continue even if order creation fails; stock change is primary
          console.error('Order creation failed for item:', {
            error: (e as any)?.message,
            itemData: it,
            validationErrors: (e as any)?.errors
          });
          logger.error('rental order create failed on complete', {
            error: (e as any)?.message,
            sessionUserId: session.user.id,
            itemData: it
          });
        }
      }

      logger.http('POST /api/orders/complete (no-tx)', { user: session.user.email, items: items.length });
      return NextResponse.json({ success: true, updated });
    } catch (opErr) {
      logger.error('order complete failed (no-tx)', { error: (opErr as any)?.message });
      return NextResponse.json({ success: false, error: (opErr as any)?.message || 'Stock update failed' }, { status: 409 });
    }
  } catch (error) {
    logger.error('order complete exception', { error });
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
