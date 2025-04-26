// api/stripe-webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buffer } from 'micro'; // Helper to read the raw request body
import { createClient } from '@supabase/supabase-js'; // <-- Import Supabase client creator
import { getStripeClient } from './utils/stripeClient.js';

// --- Configuration ---

// Fetch secrets from environment variables
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // The temporary one from 'stripe listen'
const supabaseUrl = process.env.VITE_SUPABASE_URL; // Public URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Secure Service Role Key

// Basic validation
if (!webhookSecret) {
  console.error('🔴 Error: Missing Stripe Webhook Secret in .env');
  // Don't throw detailed errors in production, but this helps debugging
  throw new Error('Server configuration error: Stripe webhook secret missing.');
}
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('🔴 Error: Missing Supabase URL or Service Role Key in .env');
  throw new Error('Server configuration error: Missing Supabase admin credentials.');
}

// Get the Stripe client from our singleton
const stripe = getStripeClient();

// Initialize Supabase Admin Client
// IMPORTANT: Use the Service Role Key here for backend operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false } // Recommended for server-side operations
});

// --- Vercel Specific Configuration ---

// Tell Vercel *not* to parse the request body automatically.
// We need the raw body buffer to verify the Stripe signature.
export const config = {
  api: {
    bodyParser: false,
  },
};

// --- Webhook Handler Logic ---

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Get the signature from the request headers
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    console.warn('⚠️ Webhook received without a stripe-signature header.');
    return res.status(400).send('Missing stripe-signature header.');
  }

  let event;

  try {
    // Read the raw request body using the 'micro' helper
    const rawBody = await buffer(req);

    // Verify the event signature using the raw body and the webhook secret
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret!);
    console.log('✅ Webhook signature verified.');

  } catch (err: any) {
    // Signature verification failed
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // --- Handle Specific Stripe Events ---

  // Successfully handle the event
  console.log(`Received event: ${event.type}`);

  // Focus on the event indicating a completed checkout session
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Retrieve the user ID we stored earlier
    const userId = session.client_reference_id;

    // --- Extract Stripe Customer ID ---
    const customerId = session.customer;
    if (!customerId) {
        console.warn(`⚠️ Webhook Warning: checkout.session.completed event for user ${userId || 'UNKNOWN'} missing customer ID. Session ID: ${session.id}. Cannot store customer ID.`);
        // Potentially handle this case differently if needed
    }

    if (userId) {
      console.log(`✅ Payment successful for User ID: ${userId}. Attempting profile update...`);

      // --- Include customerId in update payload ---
      const updatePayload: { is_subscribed: boolean; stripe_customer_id?: string } = {
          is_subscribed: true
      };
      if (customerId) {
          updatePayload.stripe_customer_id = customerId;
      }

      try {
        // Update the user's profile in Supabase
        const { data, error } = await supabaseAdmin
          .from('users')
          .update(updatePayload) // Use the payload with is_subscribed and potentially stripe_customer_id
          .eq('id', userId)
          .select('id, is_subscribed, stripe_customer_id') // Select the updated fields
          .single();

        if (error) {
          console.error(`❌ DB Error: Failed to update profile for user ${userId}. Supabase error:`, error);
        } else {
          console.log(`✅ DB Success: Successfully updated profile for user ${userId}. Profile data:`, data);
        }
      } catch (updateError) {
        console.error(`❌ Exception during profile update for user ${userId}:`, updateError);
      }

    } else {
      // Handle case where userId is missing (shouldn't happen with client_reference_id set)
      console.warn(`⚠️ Webhook Warning: Payment successful but no userId found in client_reference_id. Session ID: ${session.id}. Cannot update profile.`);
    }
  } else {
    // Log other unhandled events
    console.log(`🪵 Received unhandled event type: ${event.type}`);
  }

  // --- Acknowledge Receipt ---
  res.status(200).end('Webhook received and processed');
}