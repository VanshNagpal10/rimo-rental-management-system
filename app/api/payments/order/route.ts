import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string
});

export async function POST(request: Request) {
  const body = await request.json();
  const amount = body.amount;
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  try {
    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: 'INR',
      receipt: `rcpt_${uuidv4().replace(/-/g, '')}`,
    };
    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (err: any) {
    console.error('Razorpay order creation failed:', err);
    return NextResponse.json({ error: 'Failed to create order', details: err.message || err }, { status: 500 });
  }
}
