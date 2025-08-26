/**
 * Products API Route Handler
 * Handles CRUD operations for rental products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ApiResponse } from '@/types';

/**
 * GET /api/products
 * Fetch products with optional filtering
 * For customers: shows all available products
 * For business owners: shows only their products
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const available = searchParams.get('available');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const myProducts = searchParams.get('myProducts'); // Flag for business owners to see their products

    // Get session for role-based filtering
    const session = await getServerSession(authOptions);

    // Build query object
    let query: any = {};

    // For business owners requesting their products
    if (myProducts === 'true' && session?.user?.role === 'enduser') {
      query.endUserId = session.user.id;
    }

    // Availability filter is optional now; when omitted, show all (including unavailable)
    if (available === 'true') {
      query.availability = true;
    } else if (available === 'false') {
      query.availability = false;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseInt(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseInt(maxPrice);
    }

    let products;

    // Handle text search
    if (search) {
      // For search, we need to implement a basic text search since Product.searchProducts might not exist
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
      products = await Product.find(query).populate('endUserId', 'name companyName').sort({ createdAt: -1 });
    } else {
      products = await Product.find(query).populate('endUserId', 'name companyName').sort({ createdAt: -1 });
    }

    logger.http('GET /api/products', { 
      count: products.length,
      filters: { category, search, available, minPrice, maxPrice, myProducts },
      userId: session?.user?.id,
      role: session?.user?.role
    });

    const response: ApiResponse = {
      success: true,
      data: products,
      message: `Found ${products.length} products`
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching products', { error });
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch products',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/products
 * Create a new product (End user only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and end user role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'enduser') {
      logger.warn('Unauthorized product creation attempt', {
        user: session?.user?.email || 'unknown',
        role: session?.user?.role || 'none'
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized. Business owner access required.',
      };
      
      return NextResponse.json(response, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      description,
      image,
      category,
      pricePerHour,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
      pricePerYear,
      quantityAvailable,
      units,
      availability = true,
    } = body;

    // Validate required fields
    if (!name || !category || !quantityAvailable || !units) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: name, category, quantityAvailable, and units are required',
      };
      
      return NextResponse.json(response, { status: 400 });
    }

    // Validate at least one price is provided (and greater than 0)
    const hasValidPrice = (pricePerHour && pricePerHour > 0) || 
                         (pricePerDay && pricePerDay > 0) || 
                         (pricePerWeek && pricePerWeek > 0) || 
                         (pricePerMonth && pricePerMonth > 0) || 
                         (pricePerYear && pricePerYear > 0);
    
    if (!hasValidPrice) {
      const response: ApiResponse = {
        success: false,
        error: 'At least one pricing option with a value greater than 0 must be provided',
      };
      
      return NextResponse.json(response, { status: 400 });
    }

    // Create new product
    const productData: any = {
      name: name.trim(),
      description: description?.trim() || '',
      image: image || '/placeholder-product.jpg',
      category: category.trim(),
      endUserId: session.user.id, // Link to the business owner
      units,
      quantityAvailable: parseInt(quantityAvailable),
      availability,
    };

    // Add prices only if they are provided and greater than 0
    if (pricePerHour && pricePerHour > 0) {
      productData.pricePerHour = parseFloat(pricePerHour);
    }
    if (pricePerDay && pricePerDay > 0) {
      productData.pricePerDay = parseFloat(pricePerDay);
    }
    if (pricePerWeek && pricePerWeek > 0) {
      productData.pricePerWeek = parseFloat(pricePerWeek);
    }
    if (pricePerMonth && pricePerMonth > 0) {
      productData.pricePerMonth = parseFloat(pricePerMonth);
    }
    if (pricePerYear && pricePerYear > 0) {
      productData.pricePerYear = parseFloat(pricePerYear);
    }

    const product = new Product(productData);

    await product.save();

    logger.info('New product created', {
      productId: product._id,
      name: product.name,
      category: product.category,
      createdBy: session.user.email,
    });

    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.error('Error creating product', { error });
    
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
      error: 'Failed to create product',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
