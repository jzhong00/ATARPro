// api/create-customer-portal-session.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Ensure required environment variables are loaded
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; // Default for local dev

// Basic validation for environment variables
if (!stripeSecretKey) {
  console.error('Stripe secret key is missing from environment variables.');
  throw new Error('Server configuration error: Missing Stripe credentials.');
}
if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase URL or Service Role Key is missing from environment variables.');
    throw new Error('Server configuration error: Missing Supabase credentials.');
}

let stripeModule: typeof import('stripe') | null = null;

export const getStripe = async () => {
  if (!stripeModule) {
    stripeModule = await import('stripe');
  }
  return stripeModule.default; // default is the Stripe constructor
};

const Stripe = await getStripe();

// Initialize Stripe client
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil', // Match version from other endpoints
  typescript: true,
});

// Initialize Supabase Admin client
// Note: Use the Service Role Key for backend operations; DO NOT expose this key client-side.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // For improved security, consider validating a JWT here instead.
    const { userId } = req.body;

    if (!userId) {
      console.warn('User ID missing from request body for create-customer-portal-session');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch the user's Stripe Customer ID from your database
    const { data: user, error: dbError } = await supabaseAdmin
        .from('users') // Ensure this matches your table name (e.g., 'profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

    if (dbError) {
        console.error(`Database error fetching Stripe Customer ID for user ${userId}:`, dbError);
        return res.status(500).json({ error: 'Database error fetching customer information.' });
    }
    if (!user) {
        console.warn(`User not found in DB for ID: ${userId} when creating portal session.`);
        return res.status(404).json({ error: 'User not found.' });
    }
    if (!user.stripe_customer_id) {
        console.warn(`Stripe Customer ID missing for user ${userId}. Cannot create portal session.`);
        // You might want to redirect the user to subscribe first, or show an appropriate message.
        return res.status(400).json({ error: 'Subscription information not found. Please subscribe first.' });
    }

    const customerId = user.stripe_customer_id;
    const returnUrl = `${siteUrl}/app`; // Redirect user here after portal session

    // Create a Stripe Billing Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    // Return the session URL to the frontend
    res.status(200).json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Error creating Stripe Customer Portal session:', error);
    // Differentiate Stripe errors from other errors if needed
    if (error instanceof Stripe.errors.StripeError) {
         return res.status(500).json({ error: `Stripe error: ${error.message}` });
    } else {
         return res.status(500).json({ error: `Internal server error: ${error.message || error}` });
    }
  }
} 