/**
 * Database Seed Script
 * Populates the database with sample data for development and testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB URI - use rimo database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rimo';

// Sample data
const sampleUsers = [
  // End Users (Business Owners)
  {
    name: 'PhotoPro Rentals',
    email: 'admin@photopro.com',
    password: 'password123',
    role: 'enduser',
    phone: '+91-9876543210',
    address: 'Bandra West, Mumbai, Maharashtra',
    companyName: 'PhotoPro Rentals',
    businessType: 'Photography Equipment'
  },
  {
    name: 'ToolMaster Equipment',
    email: 'contact@toolmaster.com',
    password: 'password123',
    role: 'enduser',
    phone: '+91-9876543211',
    address: 'Connaught Place, New Delhi',
    companyName: 'ToolMaster Equipment',
    businessType: 'Tool Rental'
  },
  {
    name: 'Adventure Gear Co',
    email: 'info@adventuregear.com',
    password: 'password123',
    role: 'enduser',
    phone: '+91-9876543212',
    address: 'Whitefield, Bangalore, Karnataka',
    companyName: 'Adventure Gear Co',
    businessType: 'Event Rental'
  },
  // Customers
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    password: 'password123',
    role: 'customer',
    phone: '+91-9876543213',
    address: 'Andheri East, Mumbai, Maharashtra'
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    password: 'password123',
    role: 'customer',
    phone: '+91-9876543214',
    address: 'Sector 18, Gurgaon, Haryana'
  },
  {
    name: 'Arjun Reddy',
    email: 'arjun.reddy@email.com',
    password: 'password123',
    role: 'customer',
    phone: '+91-9876543215',
    address: 'Koramangala, Bangalore, Karnataka'
  }
];

const sampleProducts = [
  // PhotoPro Rentals products
  {
    name: 'Canon EOS R5 Camera Kit',
    description: 'Professional mirrorless camera with 24-105mm lens, perfect for weddings and events. Includes extra batteries, memory cards, and camera bag.',
    image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500&h=300&fit=crop',
    category: 'Photography',
    pricePerHour: 150,
    pricePerDay: 800,
    pricePerWeek: 4500,
    pricePerMonth: 15000,
    pricePerYear: 150000,
    availability: true,
    units: 'day',
    quantityAvailable: 3
  },
  {
    name: 'Professional Lighting Kit',
    description: 'Complete studio lighting setup with softboxes, stands, and continuous lights. Ideal for portrait photography and small video productions.',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=300&fit=crop',
    category: 'Photography',
    pricePerHour: 100,
    pricePerDay: 600,
    pricePerWeek: 3500,
    pricePerMonth: 12000,
    pricePerYear: 120000,
    availability: true,
    units: 'day',
    quantityAvailable: 2
  },
  // ToolMaster products
  {
    name: 'Heavy Duty Electric Drill Set',
    description: 'Professional grade electric drill with comprehensive bit set, perfect for construction and home improvement projects.',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&h=300&fit=crop',
    category: 'Tools',
    pricePerHour: 50,
    pricePerDay: 200,
    pricePerWeek: 1000,
    pricePerMonth: 3500,
    pricePerYear: 35000,
    availability: true,
    units: 'day',
    quantityAvailable: 5
  },
  {
    name: 'Circular Saw',
    description: 'High-performance circular saw for cutting wood, metal, and other materials. Includes safety equipment and extra blades.',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&h=300&fit=crop',
    category: 'Tools',
    pricePerHour: 75,
    pricePerDay: 300,
    pricePerWeek: 1500,
    pricePerMonth: 5000,
    pricePerYear: 50000,
    availability: true,
    units: 'day',
    quantityAvailable: 3
  },
  // Adventure Gear products
  {
    name: '4-Person Camping Tent',
    description: 'Waterproof and wind-resistant camping tent suitable for 4 people. Easy to set up and includes ground tarp and stakes.',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&h=300&fit=crop',
    category: 'Sports',
    pricePerHour: 25,
    pricePerDay: 150,
    pricePerWeek: 800,
    pricePerMonth: 2500,
    pricePerYear: 25000,
    availability: true,
    units: 'day',
    quantityAvailable: 8
  },
  {
    name: 'Mountain Bike',
    description: 'High-quality mountain bike suitable for trails and rough terrain. Includes helmet and basic maintenance kit.',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=300&fit=crop',
    category: 'Sports',
    pricePerHour: 100,
    pricePerDay: 400,
    pricePerWeek: 2000,
    pricePerMonth: 6000,
    pricePerYear: 60000,
    availability: true,
    units: 'day',
    quantityAvailable: 4
  },
  {
    name: 'Portable PA System',
    description: 'Complete portable sound system with wireless microphones, perfect for events, presentations, and parties.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop',
    category: 'Events',
    pricePerHour: 200,
    pricePerDay: 1000,
    pricePerWeek: 5000,
    pricePerMonth: 15000,
    pricePerYear: 150000,
    availability: true,
    units: 'day',
    quantityAvailable: 2
  }
];

// User Schema Definition
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'enduser'], required: true },
  phone: String,
  address: String,
  companyName: String,
  businessType: String
}, { timestamps: true });

// Product Schema Definition
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  pricePerWeek: { type: Number, required: true },
  pricePerMonth: { type: Number, required: true },
  pricePerYear: { type: Number, required: true },
  availability: { type: Boolean, default: true },
  endUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  units: { type: String, enum: ['hour', 'day', 'week', 'month', 'year'], default: 'day' },
  quantityAvailable: { type: Number, default: 1 }
}, { timestamps: true });

// RentalOrder Schema (minimal for seeding orders)
const rentalOrderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: String,
  customerEmail: String,
  startDate: Date,
  endDate: Date,
  duration: Number,
  durationUnit: { type: String, default: 'day' },
  totalPrice: Number,
  status: { type: String, default: 'confirmed' },
  paymentStatus: { type: String, default: 'paid' },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Create models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const RentalOrder = mongoose.model('RentalOrder', rentalOrderSchema);

/**
 * Seed the database with sample data
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await RentalOrder.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`   ✅ Created ${userData.role}: ${userData.name} (${userData.email})`);
    }

    // Create products for end users
    console.log('📦 Creating products...');
    const endUsers = createdUsers.filter(user => user.role === 'enduser');
    
    // Map products to end users
    const productEndUserMap = {
      'Canon EOS R5 Camera Kit': 'admin@photopro.com',
      'Professional Lighting Kit': 'admin@photopro.com',
      'Heavy Duty Electric Drill Set': 'contact@toolmaster.com',
      'Circular Saw': 'contact@toolmaster.com',
      '4-Person Camping Tent': 'info@adventuregear.com',
      'Mountain Bike': 'info@adventuregear.com',
      'Portable PA System': 'info@adventuregear.com'
    };

    const createdProducts = [];
    for (const productData of sampleProducts) {
      const endUserEmail = productEndUserMap[productData.name];
      const endUser = endUsers.find(user => user.email === endUserEmail);
      
      if (endUser) {
        const product = new Product({
          ...productData,
          endUserId: endUser._id
        });
        await product.save();
        createdProducts.push({ product, endUser });
        console.log(`   ✅ Created product: ${productData.name} for ${endUser.companyName}`);
      }
    }

    // Create sample rental orders to power dashboard/customer pages
    console.log('🧾 Creating sample rental orders...');
    const customers = createdUsers.filter(u => u.role === 'customer');
    const ordersToCreate = [];
    for (let i = 0; i < Math.min(12, createdProducts.length); i++) {
      const { product, endUser } = createdProducts[i];
      const customer = customers[i % customers.length];
      const startDate = new Date();
      const endDate = new Date(Date.now() + (i % 5 + 1) * 24 * 60 * 60 * 1000);
      ordersToCreate.push({
        productId: product._id,
        customerId: customer._id,
        endUserId: endUser._id,
        customerName: customer.name,
        customerEmail: customer.email,
        startDate,
        endDate,
        duration: (i % 5) + 1,
        durationUnit: 'day',
        totalPrice: product.pricePerDay * ((i % 5) + 1),
        status: i % 4 === 0 ? 'returned' : 'confirmed',
        paymentStatus: 'paid',
      });
    }
    if (ordersToCreate.length) {
      await RentalOrder.insertMany(ordersToCreate);
      console.log(`   ✅ Created ${ordersToCreate.length} rental orders`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👥 Users created: ${createdUsers.length}`);
    console.log(`   📦 Products created: ${sampleProducts.length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('\n   End Users (Business Owners):');
    sampleUsers.filter(u => u.role === 'enduser').forEach(user => {
      console.log(`   📧 ${user.email} | 🔑 password123 | 🏢 ${user.companyName}`);
    });
    
    console.log('\n   Customers:');
    sampleUsers.filter(u => u.role === 'customer').forEach(user => {
      console.log(`   📧 ${user.email} | 🔑 password123 | 👤 ${user.name}`);
    });

    console.log('\n🌐 Access URLs:');
    console.log('   🏠 Customer Portal: http://localhost:3000');
    console.log('   🏢 Business Portal: http://localhost:3000/enduser (after login as end user)');
    console.log('   🔐 Login Page: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
