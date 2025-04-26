// api/create-checkout-session.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripeClient } from './utils/stripeClient';

// Load Price ID from environment variables
const priceId = process.env.STRIPE_PRICE_ID;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://atar-pro.vercel.app'; // Default to production

// Do not throw error during initialization - handle it in the handler instead
if (!priceId) {
  console.error('[STRIPE] Stripe price ID is missing from environment variables.');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('[STRIPE] Handling checkout session request');

  try {
    // Validate required environment variables
    if (!priceId) {
      console.error('[STRIPE] Cannot create checkout session: Missing STRIPE_PRICE_ID');
      return res.status(500).json({ 
        error: 'Server configuration error: Missing Stripe price ID',
        details: 'The STRIPE_PRICE_ID environment variable is not set.'
      });
    }

    // Extract userId from the request body sent by the frontend
    const { userId } = req.body;

    if (!userId) {
      console.error('[STRIPE] User ID missing from request body');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`[STRIPE] Creating session for user: ${userId} with price: ${priceId}`);

    try {
      // Get the singleton Stripe client
      const stripe = getStripeClient();
      
      // Define success and cancel URLs using environment variable
      const successUrl = `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${siteUrl}/payment-cancel`;
      
      // Create a Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId, // Pass the Supabase user ID
      });

      // Return the session ID to the frontend
      console.log(`[STRIPE] Session created successfully: ${session.id}`);
      return res.status(200).json({ sessionId: session.id });

    } catch (error: any) {
      // Handle Stripe-specific errors
      console.error('[STRIPE] Error in stripe.checkout.sessions.create:', error);
      return res.status(500).json({ 
        error: `Stripe API error: ${error.message}`,
        type: error.type,
        code: error.code || 'unknown'
      });
    }
  } catch (error: any) {
    // Handle general errors
    console.error('[STRIPE] Unexpected error in checkout handler:', error);
    return res.status(500).json({ 
      error: `Server error: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 