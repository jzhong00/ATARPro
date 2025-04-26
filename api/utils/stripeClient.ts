import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;
let connectionCount = 0;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('Missing Stripe secret key');
    }
    
    // Log connection count in development
    connectionCount++;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SERVER] Creating Stripe client instance #${connectionCount}`);
    }
    
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
      typescript: true,
      appInfo: {
        name: 'ATAR Calculator',
        version: '1.0.0'
      }
    });
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[SERVER] Reusing existing Stripe client instance');
  }
  
  return stripeInstance;
}

/**
 * Get the current connection count (for testing/monitoring)
 */
export function getConnectionCount(): number {
  return connectionCount;
} 