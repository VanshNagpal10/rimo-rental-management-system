/**
 * Debug Users API - Check what users exist in database
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    console.log('Debug users API called');
    
    await connectDB();
    console.log('Connected to database');
    
    const users = await User.find({}, 'email role name createdAt').limit(10);
    console.log('Found users:', users.length);
    
    return NextResponse.json({
      success: true,
      userCount: users.length,
      users: users.map(user => ({
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
