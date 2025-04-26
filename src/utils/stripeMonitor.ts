/**
 * Utility for monitoring Stripe API calls and connection attempts
 * Use this in development to track and debug Stripe connections
 */

// Track Stripe API calls across the app
let stripeCallsCounter = 0;
let connectionAttempts = 0;
const MAX_ATTEMPTS_WARNING = 5;

/**
 * Log a Stripe API call
 * @param method The API method being called
 */
export function logStripeCall(method: string): void {
  if (process.env.NODE_ENV !== 'production') {
    stripeCallsCounter++;
    console.log(`[Stripe Monitor] API call #${stripeCallsCounter}: ${method}`);
    
    // Check for potential issues
    if (stripeCallsCounter > 20) {
      console.warn(`[Stripe Monitor] Warning: High number of Stripe API calls detected (${stripeCallsCounter})`);
    }
  }
}

/**
 * Log a Stripe connection attempt
 */
export function logConnectionAttempt(): void {
  if (process.env.NODE_ENV !== 'production') {
    connectionAttempts++;
    console.log(`[Stripe Monitor] Connection attempt #${connectionAttempts}`);
    
    // Alert for potential issues
    if (connectionAttempts > MAX_ATTEMPTS_WARNING) {
      console.warn(`[Stripe Monitor] Warning: Multiple Stripe connection attempts detected (${connectionAttempts}). Potential performance issue.`);
    }
  }
}

/**
 * Reset the counters for a new session
 */
export function resetCounters(): void {
  stripeCallsCounter = 0;
  connectionAttempts = 0;
}

/**
 * Get current monitoring stats
 */
export function getStats(): { calls: number; connections: number } {
  return {
    calls: stripeCallsCounter,
    connections: connectionAttempts
  };
} 