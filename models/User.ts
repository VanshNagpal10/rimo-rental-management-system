/**
 * User Model for Authentication and Authorization
 * Handles user registration, login, and role-based access control
 */

import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '@/types';
import { logger } from '@/lib/logger';

// User schema definition with validation
const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    role: {
      type: String,
      enum: ['enduser', 'customer'],
      default: 'customer',
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
      // Required only for end users
      validate: {
        validator: function(v: string) {
          // If role is enduser, company name is required
          if ((this as any).role === 'enduser') {
            return !!(v && v.length > 0);
          }
          return true;
        },
        message: 'Company name is required for end users',
      },
    },
    businessType: {
      type: String,
      trim: true,
      enum: {
        values: [
          'Equipment Rental',
          'Tool Rental', 
          'Vehicle Rental',
          'Event Rental',
          'Photography Equipment',
          'Construction Equipment',
          'Medical Equipment',
          'Other'
        ],
        message: 'Please select a valid business type',
      },
      // Required only for end users
      validate: {
        validator: function(v: string) {
          // If role is enduser, business type is required
          if ((this as any).role === 'enduser') {
            return !!(v && v.length > 0);
          }
          return true;
        },
        message: 'Business type is required for end users',
      },
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    toJSON: {
      transform: function (doc, ret) {
        // Remove password from JSON output for security
        delete (ret as any).password;
        return ret;
      },
    },
  }
);

// Index for faster email lookups during authentication
UserSchema.index({ email: 1 });

// Pre-save middleware to hash password before saving
UserSchema.pre('save', async function (next) {
  const user = this as IUser;

  // Only hash password if it's been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }

  try {
    // Hash password with bcrypt (salt rounds: 12 for security)
    const saltRounds = 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
    
    logger.auth('Password hashed for user', user.email);
    next();
  } catch (error) {
    logger.error('Error hashing password', { error, email: user.email });
    next(error as Error);
  }
});

// Instance method to compare password for authentication
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    const user = this as IUser;
    const isMatch = await bcrypt.compare(candidatePassword, user.password);
    
    logger.auth('Password comparison', user.email, { success: isMatch });
    return isMatch;
  } catch (error) {
    logger.error('Error comparing passwords', { error });
    return false;
  }
};

// Static method to find user by email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to create admin user
UserSchema.statics.createAdmin = async function (userData: {
  email: string;
  password: string;
  name: string;
}) {
  try {
    const existingAdmin = await this.findOne({ role: 'admin' });
    if (existingAdmin) {
      logger.warn('Admin user already exists', { email: existingAdmin.email });
      return existingAdmin;
    }

    const admin = new this({
      ...userData,
      role: 'admin',
    });

    await admin.save();
    logger.auth('Admin user created', admin.email);
    return admin;
  } catch (error) {
    logger.error('Error creating admin user', { error, email: userData.email });
    throw error;
  }
};

// Virtual property to check if user is end user
UserSchema.virtual('isEndUser').get(function () {
  return this.role === 'enduser';
});

// Virtual property to check if user is customer
UserSchema.virtual('isCustomer').get(function () {
  return this.role === 'customer';
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });

// Export the model, ensuring it's not re-compiled in development
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
