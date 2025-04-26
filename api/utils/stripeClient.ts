import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;
let connectionCount = 0;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('[STRIPE] Missing Stripe secret key in environment variables');
      throw new Error('Missing Stripe secret key');
    }
    
    // Validate Stripe key format (should start with sk_)
    if (!stripeSecretKey.startsWith('sk_')) {
      console.error('[STRIPE] Invalid Stripe secret key format - should start with sk_');
      throw new Error('Invalid Stripe key format');
    }
    
    // Log connection count in development
    connectionCount++;
    console.log(`[STRIPE] Creating Stripe client instance #${connectionCount}`);
    
    try {
      stripeInstance = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
        typescript: true,
        appInfo: {
          name: 'ATAR Calculator',
          version: '1.0.0'
        }
      });
      console.log('[STRIPE] Successfully initialized Stripe client');
    } catch (error) {
      console.error('[STRIPE] Failed to initialize Stripe client:', error);
      throw error;
    }
  } else {
    console.log('[STRIPE] Reusing existing Stripe client instance');
  }
  
  return stripeInstance;
}

/**
 * Get the current connection count (for testing/monitoring)
 */
export function getConnectionCount(): number {
  return connectionCount;
} 