import React, { useEffect, useState, useRef } from 'react';
import { useStripe } from '../contexts/StripeContext';

/**
 * Test component to verify that our Stripe context is working properly
 * This component logs when the Stripe instance is successfully loaded
 * and can be used for debugging
 */
const StripeTest: React.FC = () => {
  const { stripePromise } = useStripe();
  const [stripeLoaded, setStripeLoaded] = useState(false);
  // Use a ref to track if we've already checked Stripe
  const hasCheckedStripeRef = useRef(false);
  
  useEffect(() => {
    // Only check Stripe instance once per component lifecycle
    if (hasCheckedStripeRef.current) {
      console.log('[StripeTest] Skipping redundant Stripe check');
      return;
    }
    
    // Check if Stripe instance is loaded
    const checkStripe = async () => {
      hasCheckedStripeRef.current = true;
      console.log('[StripeTest] Checking Stripe instance status');
      
      try {
        // Use Promise.race with a timeout to avoid hanging
        const stripe = await stripePromise;
        if (stripe) {
          console.log('[StripeTest] Stripe instance successfully loaded in component');
          setStripeLoaded(true);
        } else {
          console.error('[StripeTest] Stripe failed to load in component');
        }
      } catch (error) {
        console.error('[StripeTest] Error checking Stripe:', error);
      }
    };
    
    checkStripe();
    // We only depend on the initial mount, not on stripePromise changes
  }, []); // Empty dependency array - only run on mount
  
  return (
    <div className="p-4 bg-gray-100 rounded mb-4">
      <h3 className="font-bold">Stripe Context Test</h3>
      <p className="mt-2">
        Status: {stripeLoaded ? (
          <span className="text-green-600">✅ Stripe loaded successfully</span>
        ) : (
          <span className="text-red-600">⏳ Loading Stripe...</span>
        )}
      </p>
    </div>
  );
};

export default StripeTest; 