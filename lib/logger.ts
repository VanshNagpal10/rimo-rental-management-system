/**
 * Simple Universal Logger Configuration
 * Provides centralized logging for the rental management application
 * Works in both server-side (Node.js) and client-side (browser) environments
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Simple console-based logger that works everywhere
const createLogger = () => {
  const logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
  
  const shouldLog = (level: string) => {
    const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
    const currentLevel = levels[logLevel as keyof typeof levels] || 2;
    const messageLevel = levels[level as keyof typeof levels] || 2;
    return messageLevel <= currentLevel;
  };

  return {
    error: (message: string, meta?: any) => {
      if (shouldLog('error')) {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
      }
    },
    warn: (message: string, meta?: any) => {
      if (shouldLog('warn')) {
        console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
      }
    },
    info: (message: string, meta?: any) => {
      if (shouldLog('info')) {
        console.info(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
      }
    },
    http: (message: string, meta?: any) => {
      if (shouldLog('http')) {
        console.log(`[HTTP] ${message}`, meta ? JSON.stringify(meta) : '');
      }
    },
    debug: (message: string, meta?: any) => {
      if (shouldLog('debug')) {
        console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
      }
    },
  };
};

// Universal logger that works in both environments
const universalLogger = createLogger();

// Export specific logging methods for different contexts
export const logger = {
  /**
   * Log error messages - for critical issues that need immediate attention
   */
  error: (message: string, meta?: any) => {
    universalLogger.error(message, meta);
  },

  /**
   * Log warning messages - for issues that should be monitored
   */
  warn: (message: string, meta?: any) => {
    universalLogger.warn(message, meta);
  },

  /**
   * Log info messages - for general application flow
   */
  info: (message: string, meta?: any) => {
    universalLogger.info(message, meta);
  },

  /**
   * Log HTTP requests - for API endpoint monitoring
   */
  http: (message: string, meta?: any) => {
    universalLogger.http(message, meta);
  },

  /**
   * Log debug messages - for detailed development information
   */
  debug: (message: string, meta?: any) => {
    universalLogger.debug(message, meta);
  },

  /**
   * Log database operations
   */
  database: (operation: string, collection: string, details?: any) => {
    universalLogger.info(`DB ${operation}: ${collection}`, details);
  },

  /**
   * Log authentication events
   */
  auth: (event: string, user?: string, details?: any) => {
    universalLogger.info(`AUTH ${event}${user ? ` - User: ${user}` : ''}`, details);
  },

  /**
   * Log booking operations
   */
  booking: (operation: string, bookingId?: string, details?: any) => {
    universalLogger.info(`BOOKING ${operation}${bookingId ? ` - ID: ${bookingId}` : ''}`, details);
  },

  /**
   * Log payment operations
   */
  payment: (operation: string, amount?: number, details?: any) => {
    universalLogger.info(`PAYMENT ${operation}${amount ? ` - Amount: ₹${amount}` : ''}`, details);
  },
};

export default logger;
