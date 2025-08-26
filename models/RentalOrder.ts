/**
 * Rental Order Model for Rental Reservations
 * Handles the complete rental lifecycle from quotation to return
 */

import mongoose, { Schema } from 'mongoose';
import { Types } from 'mongoose';
import { logger } from '@/lib/logger';

// Define the interface for RentalOrder
interface IRentalOrder extends mongoose.Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  customerId: Types.ObjectId;
  endUserId: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  durationUnit: 'hour' | 'day' | 'week' | 'month' | 'year';
  totalPrice: number;
  depositAmount?: number;
  status: 'quotation' | 'confirmed' | 'reserved' | 'delivered' | 'returned' | 'late' | 'cancelled';
  pickupDate?: Date;
  returnDate?: Date;
  lateFees?: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  deliveryAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rental Order schema definition with comprehensive business logic
const RentalOrderSchema: Schema<IRentalOrder> = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      validate: {
        validator: async function(v: any) {
          try {
            const User = mongoose.model('User');
            const user = await User.findById(v);
            return user && user.role === 'customer';
          } catch (error) {
            return false;
          }
        },
        message: 'Invalid customer ID or user is not a customer',
      },
    },
    endUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'End user ID is required'],
      validate: {
        validator: async function(v: any) {
          try {
            const User = mongoose.model('User');
            const user = await User.findById(v);
            return user && user.role === 'enduser';
          } catch (error) {
            return false;
          }
        },
        message: 'Invalid end user ID or user is not an end user',
      },
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
    customerPhone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          // Only validate if phone is provided
          return !v || /^[\+]?[1-9][\d]{0,15}$/.test(v);
        },
        message: 'Please enter a valid phone number',
      },
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
        validator: function (this: IRentalOrder, v: Date) {
          // End date should be after start date
          return v > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1'],
    },
    durationUnit: {
      type: String,
      enum: {
        values: ['hour', 'day', 'week', 'month', 'year'],
        message: 'Invalid duration unit',
      },
      required: [true, 'Duration unit is required'],
      default: 'day',
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Price cannot be negative'],
    },
    depositAmount: {
      type: Number,
      min: [0, 'Deposit amount cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['quotation', 'confirmed', 'reserved', 'delivered', 'returned', 'late', 'cancelled'],
        message: 'Invalid rental order status',
      },
      default: 'quotation',
      required: true,
    },
    pickupDate: {
      type: Date,
      validate: {
        validator: function (this: IRentalOrder, v: Date) {
          // Pickup date should be after or equal to start date
          return !v || v >= this.startDate;
        },
        message: 'Pickup date cannot be before start date',
      },
    },
    returnDate: {
      type: Date,
      validate: {
        validator: function (this: IRentalOrder, v: Date) {
          // Return date should be after pickup date
          return !v || !this.pickupDate || v >= this.pickupDate;
        },
        message: 'Return date cannot be before pickup date',
      },
    },
    lateFees: {
      type: Number,
      min: [0, 'Late fees cannot be negative'],
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'partial', 'paid', 'refunded'],
        message: 'Invalid payment status',
      },
      default: 'pending',
      required: true,
    },
    deliveryAddress: {
      type: String,
      trim: true,
      maxlength: [300, 'Delivery address cannot exceed 300 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
RentalOrderSchema.index({ productId: 1 }); // Product-based queries
RentalOrderSchema.index({ customerId: 1 }); // Customer orders lookup
RentalOrderSchema.index({ endUserId: 1 }); // End user orders lookup
RentalOrderSchema.index({ status: 1 }); // Status filtering
RentalOrderSchema.index({ startDate: 1, endDate: 1 }); // Date range queries
RentalOrderSchema.index({ createdAt: -1 }); // Recent orders first

// Compound index for availability checking
RentalOrderSchema.index({ 
  productId: 1, 
  startDate: 1, 
  endDate: 1,
  status: 1 
});

// Pre-save middleware to validate business rules
RentalOrderSchema.pre('save', function (next) {
  const order = this as IRentalOrder;

  // Calculate duration based on start and end dates
  const startTime = order.startDate.getTime();
  const endTime = order.endDate.getTime();
  const durationMs = endTime - startTime;

  // Calculate duration based on unit
  switch (order.durationUnit) {
    case 'hour':
      order.duration = Math.ceil(durationMs / (1000 * 60 * 60));
      break;
    case 'day':
      order.duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
      break;
    case 'week':
      order.duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7));
      break;
    case 'month':
      order.duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30));
      break;
    case 'year':
      order.duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 365));
      break;
  }

  // Log rental order operation
  logger.booking('SAVE', order._id?.toString(), {
    product: order.productId,
    customer: order.customerEmail,
    endUser: order.endUserId,
    duration: order.duration,
    unit: order.durationUnit,
    status: order.status,
    totalPrice: order.totalPrice,
  });

  next();
});

// Virtual field to check if order is late
RentalOrderSchema.virtual('isLate').get(function () {
  const now = new Date();
  return this.status === 'delivered' && this.endDate < now;
});

// Virtual field to calculate late fees
RentalOrderSchema.virtual('calculatedLateFee').get(function () {
  const now = new Date();
  const isLate = this.status === 'delivered' && this.endDate < now;
  if (!isLate) return 0;
  
  const daysLate = Math.ceil((now.getTime() - this.endDate.getTime()) / (1000 * 60 * 60 * 24));
  const feePerDay = 100; // ₹100 per day late fee
  
  return daysLate * feePerDay;
});

// Virtual field to get total amount including late fees
RentalOrderSchema.virtual('totalAmountDue').get(function () {
  const now = new Date();
  const isLate = this.status === 'delivered' && this.endDate < now;
  let calculatedLateFee = 0;
  
  if (isLate) {
    const daysLate = Math.ceil((now.getTime() - this.endDate.getTime()) / (1000 * 60 * 60 * 24));
    const feePerDay = 100; // ₹100 per day late fee
    calculatedLateFee = daysLate * feePerDay;
  }
  
  return this.totalPrice + (this.lateFees || calculatedLateFee);
});

// Virtual field to get days until return
RentalOrderSchema.virtual('daysUntilReturn').get(function () {
  const now = new Date();
  const daysUntil = Math.ceil((this.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysUntil);
});

// Static method to find orders by customer
RentalOrderSchema.statics.findByCustomer = function (customerId: string) {
  return this.find({ customerId })
    .populate('productId', 'name image category')
    .populate('endUserId', 'name companyName')
    .sort({ createdAt: -1 });
};

// Static method to find orders by end user
RentalOrderSchema.statics.findByEndUser = function (endUserId: string) {
  return this.find({ endUserId })
    .populate('productId', 'name image category')
    .populate('customerId', 'name email phone')
    .sort({ createdAt: -1 });
};

// Static method to find active orders
RentalOrderSchema.statics.findActive = function () {
  return this.find({ 
    status: { $in: ['confirmed', 'reserved', 'delivered'] } 
  })
    .populate('productId', 'name image category')
    .populate('customerId', 'name email')
    .populate('endUserId', 'name companyName')
    .sort({ startDate: 1 });
};

// Static method to find late orders
RentalOrderSchema.statics.findLate = function () {
  const now = new Date();
  return this.find({
    status: 'delivered',
    endDate: { $lt: now },
  })
    .populate('productId', 'name image category')
    .populate('customerId', 'name email phone')
    .populate('endUserId', 'name companyName')
    .sort({ endDate: 1 });
};

// Static method to check product availability
RentalOrderSchema.statics.checkAvailability = async function (
  productId: string, 
  startDate: Date, 
  endDate: Date,
  excludeOrderId?: string
): Promise<boolean> {
  const query: any = {
    productId,
    status: { $in: ['confirmed', 'reserved', 'delivered'] },
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
  };

  // Exclude current order if updating
  if (excludeOrderId) {
    query._id = { $ne: excludeOrderId };
  }

  const conflictingOrders = await this.find(query);
  return conflictingOrders.length === 0;
};

// Instance method to update order status
RentalOrderSchema.methods.updateStatus = async function (newStatus: string, reason?: string) {
  const oldStatus = this.status;
  this.status = newStatus;

  // Set pickup/return dates based on status
  if (newStatus === 'delivered' && !this.pickupDate) {
    this.pickupDate = new Date();
  }
  if (newStatus === 'returned' && !this.returnDate) {
    this.returnDate = new Date();
  }

  await this.save();

  logger.booking('STATUS_UPDATE', this._id?.toString(), {
    oldStatus,
    newStatus,
    reason,
    customer: this.customerEmail,
  });

  return this;
};

// Instance method to calculate pricing
RentalOrderSchema.methods.calculatePricing = async function (product: any) {
  let unitPrice = 0;

  switch (this.durationUnit) {
    case 'hour':
      unitPrice = product.pricePerHour;
      break;
    case 'day':
      unitPrice = product.pricePerDay;
      break;
    case 'week':
      unitPrice = product.pricePerWeek;
      break;
    case 'month':
      unitPrice = product.pricePerMonth;
      break;
    case 'year':
      unitPrice = product.pricePerYear;
      break;
  }

  this.totalPrice = unitPrice * this.duration;
  return this.totalPrice;
};

// Export the model, ensuring it's not re-compiled in development
const RentalOrder = mongoose.models.RentalOrder || mongoose.model<IRentalOrder>('RentalOrder', RentalOrderSchema);

export default RentalOrder;
