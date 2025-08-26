# RIMO - Rental Management System

A modern, full-stack rental management platform built with Next.js 14, MongoDB, and TypeScript. Designed for businesses to manage their rental inventory and customers to easily rent products.

## 🌟 Features

### For End Users (Business Owners)
- **Product Management**: Add, edit, and manage rental inventory
- **Order Management**: Track rental orders from quotation to return
- **Customer Management**: View and manage customer relationships
- **Analytics Dashboard**: Revenue tracking, popular products, and business insights
- **Flexible Pricing**: Set hourly, daily, weekly, monthly, and yearly rates
- **Availability Management**: Real-time inventory tracking

### For Customers
- **Product Discovery**: Browse and search available rental products
- **Easy Booking**: Simple rental booking with date selection
- **Order Tracking**: Monitor rental status and history
- **Multiple Payment Options**: Flexible payment and deposit options
- **Location-based Search**: Find products from local businesses

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Lucide React icons, custom components
- **Logging**: Winston for comprehensive logging
- **Payment**: Razorpay integration (test mode)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/sudhansu-24/rental-management-odoo.git
cd rimo
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rimo?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Razorpay Configuration (Optional)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Environment
NODE_ENV=development
```

### 3. Database Setup

```bash
# Seed the database with sample data
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 User Roles & Access

### Business Owners (End Users)
Access the business dashboard at `/enduser` after logging in with an end user account.

**Sample End User Accounts:**
- 📧 `admin@photopro.com` | 🔑 `password123` | 🏢 PhotoPro Rentals
- 📧 `contact@toolmaster.com` | 🔑 `password123` | 🏢 ToolMaster Equipment  
- 📧 `info@adventuregear.com` | 🔑 `password123` | 🏢 Adventure Gear Co

### Customers
Browse products and make rentals from the main portal.

**Sample Customer Accounts:**
- 📧 `rahul.sharma@email.com` | 🔑 `password123` | 👤 Rahul Sharma
- 📧 `priya.patel@email.com` | 🔑 `password123` | 👤 Priya Patel
- 📧 `arjun.reddy@email.com` | 🔑 `password123` | 👤 Arjun Reddy

## 🗂️ Project Structure

```
rimo/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   ├── register/          # Registration pages
│   ├── enduser/           # Business dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── providers/        # Context providers
│   └── ui/               # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication config
│   ├── mongodb.ts        # Database connection
│   └── logger.ts         # Winston logging
├── models/               # Mongoose schemas
│   ├── User.ts           # User model
│   ├── Product.ts        # Product model
│   └── RentalOrder.ts    # Rental order model
├── scripts/              # Utility scripts
│   └── seed.js           # Database seeding
└── types/                # TypeScript definitions
```

## 🎨 Design System

The application uses a custom design system built on Tailwind CSS with the brand color `#604058`:

- **Primary Color**: `#604058` (Deep purple-brown)
- **Background**: Clean white with subtle gray accents
- **Typography**: Inter font family for modern readability
- **Components**: Consistent spacing, rounded corners, and hover states

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run seed         # Seed database with sample data

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🗃️ Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'customer' | 'enduser',
  phone: String,
  address: String,
  companyName: String,      // End users only
  businessType: String     // End users only
}
```

### Products Collection
```javascript
{
  name: String,
  description: String,
  image: String,
  category: String,
  pricePerHour: Number,
  pricePerDay: Number,
  pricePerWeek: Number,
  pricePerMonth: Number,
  pricePerYear: Number,
  availability: Boolean,
  endUserId: ObjectId,     // Reference to User
  units: String,
  quantityAvailable: Number
}
```

### RentalOrders Collection
```javascript
{
  productId: ObjectId,     // Reference to Product
  customerId: ObjectId,    // Reference to User (customer)
  endUserId: ObjectId,     // Reference to User (end user)
  startDate: Date,
  endDate: Date,
  duration: Number,
  durationUnit: String,
  totalPrice: Number,
  status: String,          // quotation, confirmed, delivered, returned, etc.
  paymentStatus: String    // pending, partial, paid, refunded
}
```

## 🔐 Authentication Flow

1. **Registration**: Users choose between Customer or Business Owner roles
2. **Login**: Role-based redirection after successful authentication
3. **Authorization**: Route protection based on user roles
4. **Session Management**: JWT-based sessions with NextAuth.js

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### MongoDB Atlas Setup

1. Create MongoDB Atlas account
2. Create a new cluster
3. Add database user and whitelist IP addresses
4. Get connection string and update `MONGODB_URI`

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Products
- `GET /api/products` - List products with filtering
- `POST /api/products` - Create new product (end users only)
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product (end users only)

### Rental Orders
- `GET /api/bookings` - List orders (role-based filtering)
- `POST /api/bookings` - Create new rental order
- `GET /api/bookings/[id]` - Get order details
- `PATCH /api/bookings/[id]` - Update order status

### Analytics
- `GET /api/stats` - Dashboard statistics (end users only)

## 🛠️ Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write comprehensive JSDoc comments
- Use meaningful variable and function names

### Logging
- Use Winston logger for all operations
- Log authentication events, database operations, and errors
- Include relevant context in log messages

### Error Handling
- Implement proper error boundaries
- Use try-catch blocks for async operations
- Return meaningful error messages to users
- Log errors with sufficient detail for debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper documentation
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@rimo.com or create an issue in the repository.

---

**Built with ❤️ by the Team-70**
