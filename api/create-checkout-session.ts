// api/create-checkout-session.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Ensure Stripe secret key and Price ID are loaded from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_ID;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; // Default for local dev

if (!stripeSecretKey || !priceId) {
  console.error('Stripe secret key or price ID is missing from environment variables.');
  throw new Error('Server configuration error: Missing Stripe credentials.');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil', // Use API version expected by types
  typescript: true,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Extract userId from the request body sent by the frontend
    const { userId } = req.body;

    if (!userId) {
      console.error('User ID missing from request body');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Define success and cancel URLs using environment variable
    const successUrl = `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/payment-cancel`;

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use the Price ID from .env
          quantity: 1,
        },
      ],
      mode: 'subscription', // Changed from 'payment' for recurring charges
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId, // Pass the Supabase user ID
    });

    // Return the session ID to the frontend
    res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Error creating Stripe session:', error);
    res.status(500).json({ error: `Could not create checkout session: ${error.message}` });
  }
} 