import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { siteConfig } from '../../services/siteConfig'; // Import siteConfig for API URL
import { loadStripe } from '@stripe/stripe-js';

interface PaymentButtonProps {
  session: Session | null; // Pass session via props
}

/**
 * Renders a button that initiates the Stripe checkout process.
 * - Requires a valid user session.
 * - Calls the backend API (`/api/create-checkout-session`) to create a Stripe session.
 * - Redirects the user to Stripe Checkout upon success.
 * - Handles loading states and displays errors.
 */

const PaymentButton: React.FC<PaymentButtonProps> = ({ session }) => {
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    if (!session?.user) {
      setError('You must be logged in to make a payment.');
      setLoading(false);
      return;
    }
    const userId = session.user.id;

    try {
      const response = await fetch(siteConfig.getApiUrl('create-checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId }),
      });

      const responseData = await response.json();
      const { sessionId, error: apiError } = responseData;

      if (!response.ok) {
        throw new Error(apiError || responseData.message || response.statusText || 'Failed to create checkout session.');
      }
      if (!sessionId) {
        throw new Error('No session ID returned from backend.');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js failed to load. Check configuration.');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) {
        setError(`Payment Error: ${stripeError.message}`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading || !session}
        className="px-12 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
      >
        {loading ? (
          <>
              <div className="flex flex-col items-center">
                <div className="loader animate-spin rounded-full h-5 w-5 border-t-4 border-white border-solid"></div>
              </div>
          </>
        ) : 'Upgrade to Pro'}
      </button>
      {error && (
        <p className="text-red-600 mt-5 text-sm bg-red-100 p-2 py-4 rounded-lg border border-red-300">
          <span className="font-semibold">Error:</span> {error}
        </p>
      )}
    </div>
  );
};

export default PaymentButton;
