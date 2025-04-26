// api/create-checkout-session.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripeClient } from './utils/stripeClient';

// Load Price ID from environment variables
const priceId = process.env.STRIPE_PRICE_ID;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://atar-pro.vercel.app'; // Default to production

if (!priceId) {
  console.error('Stripe price ID is missing from environment variables.');
  throw new Error('Server configuration error: Missing Stripe credentials.');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Get the singleton Stripe client
    const stripe = getStripeClient();
    
    // Extract userId from the request body sent by the frontend
    const { userId } = req.body;

    if (!userId) {
      console.error('User ID missing from request body');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Define success and cancel URLs using environment variable
    const successUrl = `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/payment-cancel`;

    console.log(`Creating Stripe session for user: ${userId} with price: ${priceId}`);

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
    console.log(`Stripe session created: ${session.id}`);
    res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Error creating Stripe session:', error);
    res.status(500).json({ error: `Could not create checkout session: ${error.message}` });
  }
} 