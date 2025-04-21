// api/stripe-webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { buffer } from 'micro'; // Helper to read the raw request body
import { createClient } from '@supabase/supabase-js'; // <-- Import Supabase client creator

// --- Configuration ---

// Fetch secrets from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // The temporary one from 'stripe listen'
const supabaseUrl = process.env.VITE_SUPABASE_URL; // Public URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Secure Service Role Key

// Basic validation
if (!stripeSecretKey || !webhookSecret) {
  console.error('🔴 Error: Missing Stripe API key or Webhook Secret in .env');
  // Don't throw detailed errors in production, but this helps debugging
  throw new Error('Server configuration error: Stripe credentials missing.');
}
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('🔴 Error: Missing Supabase URL or Service Role Key in .env');
  throw new Error('Server configuration error: Missing Supabase admin credentials.');
}

// Initialize the Stripe client
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil', // Use the specific version expected by types
  typescript: true,
});

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

  let event: Stripe.Event;

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
    const session = event.data.object as Stripe.Checkout.Session;

    // Retrieve the user ID we stored earlier
    const userId = session.client_reference_id;

    if (userId) {
      console.log(`✅ Payment successful for User ID: ${userId}. Attempting profile update...`);

      try {
        // Update the user's profile in Supabase using the admin client
        const { data, error } = await supabaseAdmin
          .from('users') // Use the correct table name: public.users
          .update({ is_subscribed: true }) // Set the flag to true
          .eq('id', userId) // Match the user ID from Stripe session
          .select('id, is_subscribed') // Optionally select the updated data to confirm/log
          .single(); // Expect only one row to be updated

        if (error) {
          console.error(`❌ DB Error: Failed to update profile for user ${userId}. Supabase error:`, error);
          // NOTE: Still return 200 to Stripe, but log the DB error for investigation.
          // In production, you might add monitoring/alerting here.
        } else {
          console.log(`✅ DB Success: Successfully updated profile for user ${userId}. Profile data:`, data);
        }
      } catch (updateError) {
        console.error(`❌ Exception during profile update for user ${userId}:`, updateError);
        // NOTE: Still return 200 to Stripe.
      }

    } else {
      // This shouldn't happen if client_reference_id was set correctly
      console.warn(`⚠️ Webhook Warning: Payment successful but no userId found in client_reference_id. Session ID: ${session.id}. Cannot update profile.`);
    }
  } else {
    // Log other events received (optional, good for debugging)
    console.log(`🪵 Received unhandled event type: ${event.type}`);
  }

  // --- Acknowledge Receipt ---

  // Send a 200 OK response back to Stripe to acknowledge receipt.
  // If Stripe doesn't receive this quickly, it will retry sending the event.
  res.status(200).json({ received: true });
} 