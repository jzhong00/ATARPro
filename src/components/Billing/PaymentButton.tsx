import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { siteConfig } from '../../services/siteConfig'; // Import siteConfig for API URL
import { useStripe } from '../../contexts/StripeContext';

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
// Explicitly type the functional component with its props
const PaymentButton: React.FC<PaymentButtonProps> = ({ session }) => {
  const { stripePromise } = useStripe();
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
      // 1. Call backend API to create a checkout session
      const response = await fetch(siteConfig.getApiUrl('create-checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId }), // Send the logged-in user's ID
      });

      const responseData = await response.json();
      const { sessionId, error: apiError } = responseData;

      if (!response.ok) {
        // Use error from API response if available, otherwise use status text
        throw new Error(apiError || responseData.message || response.statusText || 'Failed to create checkout session.');
      }
      if (!sessionId) {
        throw new Error('No session ID returned from backend.');
      }

      // 2. Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js failed to load. Check configuration.');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      // This point is only reached if redirectToCheckout fails immediately (e.g., network error)
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
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : 'Upgrade to Pro'}
      </button>
      {error && (
        <p className="text-red-600 mt-3 text-sm bg-red-100 p-2 rounded border border-red-300">
          <span className="font-semibold">Error:</span> {error}
        </p>
      )}
    </div>
  );
};

export default PaymentButton; 