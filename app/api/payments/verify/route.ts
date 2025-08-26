import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import BookingModel from '@/models/Booking';

export async function POST(request: Request) {
  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = body;

  const generatedSignature = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(generatedSignature.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    await dbConnect();
    await BookingModel.findByIdAndUpdate(bookingId, { status: 'confirmed', paymentId: razorpay_payment_id });
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
