/**
 * Booking Model for Rental Reservations
 * Handles booking lifecycle, pricing calculations, and status management
 */

import mongoose, { Schema } from 'mongoose';
import { IBooking } from '@/types';
import { logger } from '@/lib/logger';

// Booking schema definition with comprehensive business logic
const BookingSchema: Schema<IBooking> = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [50, 'Customer name cannot exceed 50 characters'],
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      validate: {
        validator: function (v: Date) {
          // Start date should not be in the past (with 1 hour buffer for time zones)
          const now = new Date();
          const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
          return v >= oneHourAgo;
        },
        message: 'Start date cannot be in the past',
      },
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: IBooking, v: Date) {
          // End date should be after start date
          return v > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    durationDays: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'returned', 'late', 'cancelled'],
        message: 'Invalid booking status',
      },
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
BookingSchema.index({ productId: 1 }); // Product-based queries
BookingSchema.index({ customerEmail: 1 }); // Customer bookings lookup
BookingSchema.index({ status: 1 }); // Status filtering
BookingSchema.index({ startDate: 1, endDate: 1 }); // Date range queries
BookingSchema.index({ createdAt: -1 }); // Recent bookings first

// Compound index for availability checking
BookingSchema.index({ 
  productId: 1, 
  startDate: 1, 
  endDate: 1,
  status: 1 
});

// Pre-save middleware to calculate duration and validate business rules
BookingSchema.pre('save', function (next) {
  const booking = this as IBooking;

  // Calculate duration in days
  const startTime = booking.startDate.getTime();
  const endTime = booking.endDate.getTime();
  const durationMs = endTime - startTime;
  booking.durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  // Log booking operation
  logger.booking('SAVE', booking._id?.toString(), {
    product: booking.productId,
    customer: booking.customerEmail,
    duration: booking.durationDays,
    status: booking.status,
    totalPrice: booking.totalPrice,
  });

  next();
});

// Pre-save middleware to check for booking conflicts
BookingSchema.pre('save', async function (next) {
  const booking = this as IBooking;

  // Skip conflict check for cancelled bookings or if not new/modified dates
  if (booking.status === 'cancelled' || 
      (!booking.isNew && !booking.isModified('startDate') && !booking.isModified('endDate'))) {
    return next();
  }

  try {
    // Check for overlapping bookings for the same product
    const conflictingBookings = await mongoose.model('Booking').find({
      productId: booking.productId,
      _id: { $ne: booking._id }, // Exclude current booking
      status: { $in: ['pending', 'confirmed'] }, // Only active bookings
      $or: [
        // New booking starts during existing booking
        {
          startDate: { $lte: booking.startDate },
          endDate: { $gt: booking.startDate },
        },
        // New booking ends during existing booking
        {
          startDate: { $lt: booking.endDate },
          endDate: { $gte: booking.endDate },
        },
        // New booking encompasses existing booking
        {
          startDate: { $gte: booking.startDate },
          endDate: { $lte: booking.endDate },
        },
      ],
    });

    if (conflictingBookings.length > 0) {
      logger.warn('Booking conflict detected', {
        newBooking: booking._id,
        conflictingBookings: conflictingBookings.map(b => b._id),
        productId: booking.productId,
      });
      
      const error = new Error('Product is not available for the selected dates');
      return next(error);
    }

    next();
  } catch (error) {
    logger.error('Error checking booking conflicts', { error, bookingId: booking._id });
    next(error as Error);
  }
});

// Virtual field to check if booking is late
BookingSchema.virtual('isLate').get(function () {
  const now = new Date();
  return this.status === 'confirmed' && this.endDate < now;
});

// Virtual field to calculate late fees
BookingSchema.virtual('lateFee').get(function () {
  const now = new Date();
  const isLate = this.status === 'confirmed' && this.endDate < now;
  if (!isLate) return 0;
  
  const daysLate = Math.ceil((now.getTime() - this.endDate.getTime()) / (1000 * 60 * 60 * 24));
  const feePerDay = 50; // ₹50 per day late fee
  
  return daysLate * feePerDay;
});

// Virtual field to get total amount including late fees
BookingSchema.virtual('totalAmountDue').get(function () {
  const now = new Date();
  const isLate = this.status === 'confirmed' && this.endDate < now;
  let lateFee = 0;
  
  if (isLate) {
    const daysLate = Math.ceil((now.getTime() - this.endDate.getTime()) / (1000 * 60 * 60 * 24));
    const feePerDay = 50; // ₹50 per day late fee
    lateFee = daysLate * feePerDay;
  }
  
  return this.totalPrice + lateFee;
});

// Virtual field to get days until return
BookingSchema.virtual('daysUntilReturn').get(function () {
  const now = new Date();
  const daysUntil = Math.ceil((this.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysUntil);
});

// Static method to find bookings by customer
BookingSchema.statics.findByCustomer = function (customerEmail: string) {
  return this.find({ customerEmail })
    .populate('productId', 'name image category')
    .sort({ createdAt: -1 });
};

// Static method to find active bookings
BookingSchema.statics.findActive = function () {
  return this.find({ 
    status: { $in: ['pending', 'confirmed'] } 
  })
    .populate('productId', 'name image category')
    .sort({ startDate: 1 });
};

// Static method to find late bookings
BookingSchema.statics.findLate = function () {
  const now = new Date();
  return this.find({
    status: 'confirmed',
    endDate: { $lt: now },
  })
    .populate('productId', 'name image category')
    .sort({ endDate: 1 });
};

// Static method to get bookings for date range
BookingSchema.statics.findInDateRange = function (startDate: Date, endDate: Date) {
  return this.find({
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { 
        startDate: { $lte: startDate },
        endDate: { $gte: endDate }
      },
    ],
  })
    .populate('productId', 'name image category')
    .sort({ startDate: 1 });
};

// Static method to check product availability
BookingSchema.statics.checkAvailability = async function (
  productId: string, 
  startDate: Date, 
  endDate: Date
): Promise<boolean> {
  const conflictingBookings = await this.find({
    productId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        startDate: { $lte: startDate },
        endDate: { $gt: startDate },
      },
      {
        startDate: { $lt: endDate },
        endDate: { $gte: endDate },
      },
      {
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      },
    ],
  });

  return conflictingBookings.length === 0;
};

// Instance method to update booking status
BookingSchema.methods.updateStatus = async function (newStatus: string, reason?: string) {
  const oldStatus = this.status;
  this.status = newStatus;
  await this.save();

  logger.booking('STATUS_UPDATE', this._id?.toString(), {
    oldStatus,
    newStatus,
    reason,
    customer: this.customerEmail,
  });

  return this;
};

// Instance method to calculate refund amount
BookingSchema.methods.calculateRefund = function (): number {
  const now = new Date();
  const hoursUntilStart = (this.startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Refund policy: 100% if cancelled 24+ hours before, 50% if 12-24 hours, 0% if less than 12 hours
  if (hoursUntilStart >= 24) {
    return this.totalPrice; // Full refund
  } else if (hoursUntilStart >= 12) {
    return this.totalPrice * 0.5; // 50% refund
  } else {
    return 0; // No refund
  }
};

// Instance method to extend booking
BookingSchema.methods.extendBooking = async function (newEndDate: Date, additionalPrice: number) {
  // Check if extension creates conflicts
  const isAvailable = await (this.constructor as any).checkAvailability(
    this.productId,
    this.endDate,
    newEndDate
  );

  if (!isAvailable) {
    throw new Error('Product is not available for the extension period');
  }

  this.endDate = newEndDate;
  this.totalPrice += additionalPrice;
  
  // Recalculate duration
  const durationMs = this.endDate.getTime() - this.startDate.getTime();
  this.durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  await this.save();

  logger.booking('EXTEND', this._id?.toString(), {
    newEndDate,
    additionalPrice,
    newTotalPrice: this.totalPrice,
  });

  return this;
};

// Export the model, ensuring it's not re-compiled in development
const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
