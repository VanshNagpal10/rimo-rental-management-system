/**
 * Product Model for Rental Items
 * Handles product catalog with pricing, availability, and categorization
 */

import mongoose, { Schema } from 'mongoose';
import { IProduct } from '@/types';
import { logger } from '@/lib/logger';

// Product schema definition with comprehensive validation
const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      minlength: [2, 'Product name must be at least 2 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: String,
      default: '/placeholder-product.jpg',
      validate: {
        validator: function (v: string) {
          // Allow empty string, placeholder, or valid image paths/URLs
          if (!v || v === '/placeholder-product.jpg') return true;
          return /^(https?:\/\/)?.+\.(jpg|jpeg|png|gif|webp)$/i.test(v) || v.startsWith('/') || v.startsWith('data:image/');
        },
        message: 'Please provide a valid image URL or path',
      },
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      enum: {
        values: [
          'Photography',
          'Tools',
          'Sports', 
          'Electronics',
          'Furniture',
          'Equipment',
          'Vehicles',
          'Other'
        ],
        message: 'Please select a valid category',
      },
    },
    pricePerHour: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      max: [10000, 'Hourly price seems too high'],
    },
    pricePerDay: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      max: [100000, 'Daily price seems too high'],
    },
    pricePerWeek: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      max: [500000, 'Weekly price seems too high'],
    },
    pricePerMonth: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      max: [2000000, 'Monthly price seems too high'],
    },
    pricePerYear: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      max: [20000000, 'Yearly price seems too high'],
    },
    availability: {
      type: Boolean,
      default: true,
      required: true,
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
    units: {
      type: String,
      enum: {
        values: ['hour', 'day', 'week', 'month', 'year'],
        message: 'Please select a valid unit',
      },
      default: 'day',
      required: true,
    },
    quantityAvailable: {
      type: Number,
      required: [true, 'Quantity available is required'],
      min: [0, 'Quantity cannot be negative'],
      max: [10000, 'Quantity seems too high'],
      default: 1,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Custom validation to ensure at least one price is provided
ProductSchema.pre('validate', function() {
  const hasPricing = (this.pricePerHour && this.pricePerHour > 0) || 
                    (this.pricePerDay && this.pricePerDay > 0) || 
                    (this.pricePerWeek && this.pricePerWeek > 0) || 
                    (this.pricePerMonth && this.pricePerMonth > 0) || 
                    (this.pricePerYear && this.pricePerYear > 0);
  
  if (!hasPricing) {
    this.invalidate('pricing', 'At least one rental price greater than 0 must be provided (hour, day, week, month, or year)');
  }
});

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text' }); // Text search
ProductSchema.index({ category: 1 }); // Category filtering
ProductSchema.index({ availability: 1 }); // Availability filtering
ProductSchema.index({ pricePerDay: 1 }); // Price sorting

// Pre-save validation to ensure pricing logic makes sense
ProductSchema.pre('save', function (next) {
  const product = this as IProduct;

  // Validate that weekly price is better deal than daily * 7
  if (product.pricePerWeek > product.pricePerDay * 7) {
    logger.warn('Weekly price higher than 7 daily prices', {
      productName: product.name,
      weeklyPrice: product.pricePerWeek,
      weeklyFromDaily: product.pricePerDay * 7,
    });
  }

  // Validate that daily price is better deal than hourly * 24
  if (product.pricePerDay > product.pricePerHour * 24) {
    logger.warn('Daily price higher than 24 hourly prices', {
      productName: product.name,
      dailyPrice: product.pricePerDay,
      dailyFromHourly: product.pricePerHour * 24,
    });
  }

  logger.database('SAVE', 'Product', {
    name: product.name,
    category: product.category,
    availability: product.availability,
  });

  next();
});

// Virtual field for price per minute (useful for very short rentals)
ProductSchema.virtual('pricePerMinute').get(function () {
  return Math.round((this.pricePerHour / 60) * 100) / 100; // Round to 2 decimal places
});

// Virtual field to calculate best pricing option for a given duration
ProductSchema.virtual('bestPriceForDuration').get(function () {
  return (durationHours: number) => {
    const hours = durationHours;
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    
    // Calculate different pricing options
    const hourlyTotal = hours * this.pricePerHour;
    const dailyTotal = days * this.pricePerDay + (hours % 24) * this.pricePerHour;
    const weeklyTotal = weeks * this.pricePerWeek + 
                       ((days % 7) * this.pricePerDay) + 
                       ((hours % 24) * this.pricePerHour);
    
    // Return the cheapest option
    const prices = [
      { type: 'hourly', total: hourlyTotal },
      { type: 'daily', total: dailyTotal },
      { type: 'weekly', total: weeklyTotal },
    ];
    
    return prices.reduce((cheapest, current) => 
      current.total < cheapest.total ? current : cheapest
    );
  };
});

// Static method to find available products
ProductSchema.statics.findAvailable = function () {
  return this.find({ availability: true }).sort({ createdAt: -1 });
};

// Static method to find products by category
ProductSchema.statics.findByCategory = function (category: string) {
  return this.find({ 
    category: category,
    availability: true 
  }).sort({ pricePerDay: 1 });
};

// Static method for text search
ProductSchema.statics.searchProducts = function (searchTerm: string) {
  return this.find(
    { 
      $text: { $search: searchTerm },
      availability: true 
    },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

// Static method to get products within price range
ProductSchema.statics.findInPriceRange = function (minPrice: number, maxPrice: number) {
  return this.find({
    pricePerDay: { $gte: minPrice, $lte: maxPrice },
    availability: true,
  }).sort({ pricePerDay: 1 });
};

// Instance method to toggle availability
ProductSchema.methods.toggleAvailability = async function () {
  this.availability = !this.availability;
  await this.save();
  
  logger.database('UPDATE', 'Product', {
    name: this.name,
    newAvailability: this.availability,
  });
  
  return this;
};

// Instance method to update pricing
ProductSchema.methods.updatePricing = async function (newPricing: {
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerWeek?: number;
}) {
  Object.assign(this, newPricing);
  await this.save();
  
  logger.database('UPDATE', 'Product', {
    name: this.name,
    updatedPricing: newPricing,
  });
  
  return this;
};

// Export the model, ensuring it's not re-compiled in development
const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
