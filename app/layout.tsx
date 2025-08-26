/**
 * Root Layout Component
 * Provides the main layout structure with authentication context
 * and global navigation for the rental management application
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { logger } from '@/lib/logger';
import Script from 'next/script';

// Initialize Inter font with subsets for better performance
const inter = Inter({ subsets: ['latin'] });

// Application metadata for SEO and social sharing
export const metadata: Metadata = {
  title: {
    default: 'RIMO - Smart Rental Management System',
    template: '%s | RIMO'
  },
  description: 'Modern rental management platform for easy product rentals, booking management, and customer service. Perfect for equipment, tool, and event rental businesses.',
  keywords: ['rental management', 'equipment rental', 'booking system', 'rental platform', 'tool rental'],
  authors: [{ name: 'RIMO Team' }],
  creator: 'RIMO',
  publisher: 'RIMO',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'RIMO',
    title: 'RIMO - Smart Rental Management System',
    description: 'Modern rental management platform for easy product rentals and booking management.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RIMO - Smart Rental Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RIMO - Smart Rental Management System',
    description: 'Modern rental management platform for easy product rentals and booking management.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

/**
 * Root Layout Component
 * Wraps all pages with authentication context and global layout elements
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Log application startup in development
  if (process.env.NODE_ENV === 'development') {
    logger.info('Application layout rendering', {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  }

  return (
    <html lang="en" className="h-full">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        
        {/* Additional meta tags */}
        <meta name="application-name" content="RentalManager" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RentalManager" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      
      <body className={`${inter.className} h-full flex flex-col`}>
        {/* Authentication Provider - wraps entire app with auth context */}
        <AuthProvider>
          {/* Main Layout Structure */}
          <div className="min-h-full flex flex-col">
            {/* Navigation Header */}
            <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
              <Navbar />
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col">
              {/* Page Content */}
              <div className="flex-1">
                {children}
              </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
              <Footer />
            </footer>
          </div>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>

        {/* Development helpers */}
        {process.env.NODE_ENV === 'development' && (
          <>
            {/* Development indicator */}
            <div className="fixed bottom-4 left-4 z-50 no-print">
              <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                DEV
              </div>
            </div>
          </>
        )}
        <Script id="chatbase-script">
          {`
            (function(){
              if(!window.chatbase||window.chatbase("getState")!=="initialized"){
                window.chatbase=(...arguments)=>{
                  if(!window.chatbase.q){window.chatbase.q=[]}
                  window.chatbase.q.push(arguments)
                };
                window.chatbase=new Proxy(window.chatbase,{
                  get(target,prop){
                    if(prop==="q"){return target.q}
                    return(...args)=>target(prop,...args)
                  }
                })
              }
              const onLoad=function(){
                const script=document.createElement("script");
                script.src="https://www.chatbase.co/embed.min.js";
                script.id="faEwmDJY7uFQ24p_75nUy";
                script.domain="www.chatbase.co";
                document.body.appendChild(script)
              };
              if(document.readyState==="complete"){
                onLoad()
              } else {
                window.addEventListener("load",onLoad)
              }
            })()
          `}
        </Script>
      </body>
    </html>
  );
}
