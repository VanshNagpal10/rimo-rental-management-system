/**
 * Authentication Provider Component
 * Wraps the application with NextAuth SessionProvider
 * and provides authentication context to all child components
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface AuthProviderProps {
  children: ReactNode;
  session?: any; // NextAuth session type
}

/**
 * AuthProvider wraps the app with NextAuth SessionProvider
 * Enables authentication state management throughout the application
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  // Log authentication provider initialization in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('AuthProvider initialized', {
      hasSession: !!session,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <SessionProvider 
      session={session}
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session when window gains focus
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
