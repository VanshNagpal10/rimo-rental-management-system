/**
 * Single Product API Route Handler
 * Handles operations for individual products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ApiResponse } from '@/types';

/**
 * GET /api/products/[id]
 * Fetch a single product by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const product = await Product.findById(params.id);
    
    if (!product) {
      logger.warn('Product not found', { productId: params.id });
      
      const response: ApiResponse = {
        success: false,
        error: 'Product not found',
      };
      
      return NextResponse.json(response, { status: 404 });
    }

    logger.http('GET /api/products/[id]', { productId: params.id, name: product.name });

    const response: ApiResponse = {
      success: true,
      data: product,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching product', { error, productId: params.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch product',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/products/[id]
 * Update a product (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and end user role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'enduser') {
      logger.warn('Unauthorized product update attempt', {
        user: session?.user?.email || 'unknown',
        productId: params.id
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. Business owner access required.',
      };
      
      return NextResponse.json(response, { status: 401 });
    }

    await connectDB();

    // Check if product exists and belongs to the user
    const existingProduct = await Product.findById(params.id);
    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found',
      };
      
      return NextResponse.json(response, { status: 404 });
    }

    // Check ownership
    if (existingProduct.endUserId.toString() !== session.user.id) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. You can only update your own products.',
      };
      
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    
    const product = await Product.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );

    logger.info('Product updated', {
      productId: params.id,
      name: product.name,
      updatedBy: session.user.email,
    });

    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error updating product', { error, productId: params.id });
    
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
      error: 'Failed to update product',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/products/[id]
 * Partially update a product (End user only - owner of the product)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and end user role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'enduser') {
      logger.warn('Unauthorized product update attempt', {
        user: session?.user?.email || 'unknown',
        productId: params.id
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. Business owner access required.',
      };
      
      return NextResponse.json(response, { status: 401 });
    }

    await connectDB();

    // Check if product exists and belongs to the user
    const existingProduct = await Product.findById(params.id);
    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found',
      };
      
      return NextResponse.json(response, { status: 404 });
    }

    // Check ownership
    if (existingProduct.endUserId.toString() !== session.user.id) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. You can only update your own products.',
      };
      
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    
    // For PATCH, we only update the fields that are provided
    const updateFields: any = {};
    
    if (body.availability !== undefined) {
      updateFields.availability = body.availability;
    }
    if (body.name !== undefined) {
      updateFields.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updateFields.description = body.description.trim();
    }
    if (body.category !== undefined) {
      updateFields.category = body.category;
    }
    if (body.quantityAvailable !== undefined) {
      updateFields.quantityAvailable = parseInt(body.quantityAvailable);
    }
    // Add price fields if provided
    if (body.pricePerHour !== undefined) {
      updateFields.pricePerHour = parseFloat(body.pricePerHour) || undefined;
    }
    if (body.pricePerDay !== undefined) {
      updateFields.pricePerDay = parseFloat(body.pricePerDay) || undefined;
    }
    if (body.pricePerWeek !== undefined) {
      updateFields.pricePerWeek = parseFloat(body.pricePerWeek) || undefined;
    }
    if (body.pricePerMonth !== undefined) {
      updateFields.pricePerMonth = parseFloat(body.pricePerMonth) || undefined;
    }
    if (body.pricePerYear !== undefined) {
      updateFields.pricePerYear = parseFloat(body.pricePerYear) || undefined;
    }
    
    const product = await Product.findByIdAndUpdate(
      params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    logger.info('Product updated', {
      productId: params.id,
      name: product?.name,
      updatedFields: Object.keys(updateFields),
      updatedBy: session.user.email,
    });

    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error updating product', { error, productId: params.id });
    
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
      error: 'Failed to update product',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
        // Check authentication and end user role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'enduser') {
      logger.warn('Unauthorized product deletion attempt', {
        user: session?.user?.email || 'unknown',
        productId: params.id
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. Business owner access required.',
      };
      
      return NextResponse.json(response, { status: 401 });
    }

    await connectDB();
    
    // Check if product exists and belongs to the user
    const existingProduct = await Product.findById(params.id);
    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found',
      };
      
      return NextResponse.json(response, { status: 404 });
    }

    // Check ownership
    if (existingProduct.endUserId.toString() !== session.user.id) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. You can only delete your own products.',
      };
      
      return NextResponse.json(response, { status: 403 });
    }
    
    const product = await Product.findByIdAndDelete(params.id);

    logger.info('Product deleted', {
      productId: params.id,
      name: product.name,
      deletedBy: session.user.email,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Product deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error deleting product', { error, productId: params.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete product',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
