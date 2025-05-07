// api/stripe-webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buffer } from 'micro'; // Helper to read the raw request body
import { createClient } from '@supabase/supabase-js'; // <-- Import Supabase client creator

// --- Configuration ---

// Fetch secrets from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // The temporary one from 'stripe listen'
const supabaseUrl = process.env.VITE_SUPABASE_URL; // Public URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Secure Service Role Key

console.log('🔧 Initializing configuration...');
console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'Missing');

// Basic validation
if (!stripeSecretKey || !webhookSecret) {
  console.error('🔴 Error: Missing Stripe API key or Webhook Secret in .env');
  throw new Error('Server configuration error: Stripe credentials missing.');
}
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('🔴 Error: Missing Supabase URL or Service Role Key in .env');
  throw new Error('Server configuration error: Missing Supabase admin credentials.');
}

import type StripeType from 'stripe'; // ✅ only for types

let stripeModule: typeof import('stripe') | null = null;

export const fetchStripe = async () => {
  if (!stripeModule) {
    console.log('🔄 Loading Stripe module...');
    stripeModule = await import('stripe');
  }
  return stripeModule.default; // default is the Stripe constructor
};

console.log('🔧 Fetching Stripe module...');
const Stripe = await fetchStripe();

// Initialize the Stripe client
console.log('🔧 Initializing Stripe client...');
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil', // Use the specific version expected by types
  typescript: true,
});

// Initialize Supabase Admin Client
console.log('🔧 Initializing Supabase Admin Client...');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false } // Recommended for server-side operations
});

// --- Vercel Specific Configuration ---

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
  console.log('🔧 Webhook handler invoked...');
  console.log('Request method:', req.method);

  if (req.method !== 'POST') {
    console.warn('⚠️ Invalid request method:', req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const signature = req.headers['stripe-signature'] as string;
  console.log('Stripe signature header:', signature ? 'Present' : 'Missing');

  if (!signature) {
    console.warn('⚠️ Webhook received without a stripe-signature header.');
    return res.status(400).send('Missing stripe-signature header.');
  }

  let event: StripeType.Event;

  try {
    console.log('🔧 Reading raw request body...');
    const rawBody = await buffer(req);

    console.log('🔧 Verifying event signature...');
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret!);
    console.log('✅ Event signature verified successfully.');
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🔧 Processing event type:', event.type);

  if (event.type === 'checkout.session.completed') {
    console.log('✅ Handling checkout.session.completed event...');
    const session = event.data.object as StripeType.Checkout.Session;

    const userId = session.client_reference_id;
    console.log('User ID from client_reference_id:', userId);

    const customerId = session.customer as string;
    console.log('Stripe Customer ID:', customerId || 'Missing');

    if (userId) {
      const updatePayload: { stripe_customer_id?: string; expires_at?: string } = {
        expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      };
      if (customerId) {
        updatePayload.stripe_customer_id = customerId;
      }

      console.log('Update payload:', updatePayload);

      try {
        console.log('🔧 Updating user profile in Supabase...');
        const { error } = await supabaseAdmin
          .from('users')
          .update(updatePayload)
          .eq('id', userId)
          .select('id, stripe_customer_id, expires_at')
          .single();

        if (error) {
          console.error(`DB Error: Failed to update profile for user ${userId}. Supabase error:`, error);
        } else {
          console.log(`✅ Successfully updated profile for user ${userId}.`);
        }
      } catch (updateError) {
        console.error(`Exception during profile update for user ${userId}:`, updateError);
      }
    } else {
      console.warn(`⚠️ Webhook Warning: Payment successful but no userId found in client_reference_id. Session ID: ${session.id}. Cannot update profile.`);
    }
  } else {
    console.log(`Received unhandled event type: ${event.type}`);
  }

  console.log('✅ Webhook processing complete.');
  res.status(200).end('Webhook received and processed');
}