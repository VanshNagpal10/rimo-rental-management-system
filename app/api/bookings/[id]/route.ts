/**
 * Single Booking API Route Handler
 * Handles operations for individual bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ApiResponse } from '@/types';

/**
 * GET /api/bookings/[id]
 * Fetch a single booking by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const booking = await Booking.findById(params.id)
      .populate('productId', 'name image category pricePerDay pricePerHour pricePerWeek');
    
    if (!booking) {
      logger.warn('Booking not found', { bookingId: params.id });
      
      const response: ApiResponse = {
        success: false,
        error: 'Booking not found',
      };
      
      return NextResponse.json(response, { status: 404 });
    }

    // Check authorization - customers can only view their own bookings
    if (session.user.role === 'customer' && booking.customerEmail !== session.user.email) {
      logger.warn('Unauthorized booking access attempt', {
        user: session.user.email,
        bookingId: params.id,
        bookingCustomer: booking.customerEmail
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. You can only view your own bookings.',
      };
      
      return NextResponse.json(response, { status: 403 });
    }

    logger.http('GET /api/bookings/[id]', { 
      bookingId: params.id, 
      user: session.user.email 
    });

    const response: ApiResponse = {
      success: true,
      data: booking,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching booking', { error, bookingId: params.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch booking',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/bookings/[id]
 * Update booking status or details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { status, ...otherUpdates } = body;

    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      const response: ApiResponse = {
        success: false,
        error: 'Booking not found',
      };
      
      return NextResponse.json(response, { status: 404 });
    }

    // Authorization checks based on update type
    if (status) {
      // Only endusers can update booking status
      if (session.user.role !== 'enduser') {
        logger.warn('Unauthorized status update attempt', {
          user: session.user.email,
          bookingId: params.id,
          attemptedStatus: status
        });
        
        const response: ApiResponse = {
          success: false,
          error: 'Unauthorized. Only endusers can update booking status.',
        };
        
        return NextResponse.json(response, { status: 403 });
      }

      // Update status using the model method for proper logging
      await booking.updateStatus(status, `Updated by ${session.user.email}`);
    }

    // Handle other updates (customers can update their own bookings if pending)
    if (Object.keys(otherUpdates).length > 0) {
      // Customers can only update their own pending bookings
      if (session.user.role === 'customer') {
        if (booking.customerEmail !== session.user.email) {
          const response: ApiResponse = {
            success: false,
            error: 'Unauthorized. You can only update your own bookings.',
          };
          
          return NextResponse.json(response, { status: 403 });
        }

        if (booking.status !== 'pending') {
          const response: ApiResponse = {
            success: false,
            error: 'Can only update pending bookings.',
          };
          
          return NextResponse.json(response, { status: 400 });
        }
      }

      // Apply other updates
      Object.assign(booking, otherUpdates);
      await booking.save();
    }

    // Refresh booking with populated data
    const updatedBooking = await Booking.findById(params.id)
      .populate('productId', 'name image category');

    logger.booking('UPDATE', params.id, {
      updatedBy: session.user.email,
      updates: { status, ...otherUpdates }
    });

    const response: ApiResponse = {
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error updating booking', { error, bookingId: params.id });
    
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
      error: 'Failed to update booking',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/bookings/[id]
 * Cancel/Delete a booking
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const booking = await Booking.findById(params.id);

    if (!booking) {
      const response: ApiResponse = {
        success: false,
        error: 'Booking not found',
      };
      
      return NextResponse.json(response, { status: 404 });
    }

    // Authorization check
    if (session.user.role === 'customer' && booking.customerEmail !== session.user.email) {
      logger.warn('Unauthorized booking deletion attempt', {
        user: session.user.email,
        bookingId: params.id,
        bookingCustomer: booking.customerEmail
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. You can only cancel your own bookings.',
      };
      
      return NextResponse.json(response, { status: 403 });
    }

    // Instead of deleting, update status to cancelled for audit trail
    await booking.updateStatus('cancelled', `Cancelled by ${session.user.email}`);

    logger.booking('CANCEL', params.id, {
      cancelledBy: session.user.email,
      originalStatus: booking.status
    });

    const response: ApiResponse = {
      success: true,
      message: 'Booking cancelled successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error cancelling booking', { error, bookingId: params.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to cancel booking',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
