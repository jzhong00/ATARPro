import React, { useEffect, useState } from 'react';
import { useStripe } from '../contexts/StripeContext';

/**
 * Test component to verify that our Stripe context is working properly
 * This component logs when the Stripe instance is successfully loaded
 * and can be used for debugging
 */
const StripeTest: React.FC = () => {
  const { stripePromise } = useStripe();
  const [stripeLoaded, setStripeLoaded] = useState(false);
  
  useEffect(() => {
    // Check if Stripe instance is loaded
    const checkStripe = async () => {
      const stripe = await stripePromise;
      if (stripe) {
        console.log('Stripe instance successfully loaded in component');
        setStripeLoaded(true);
      } else {
        console.error('Stripe failed to load in component');
      }
    };
    
    checkStripe();
  }, [stripePromise]);
  
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