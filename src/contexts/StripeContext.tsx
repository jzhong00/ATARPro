import { createContext, useContext, ReactNode, useEffect } from 'react';
import { Stripe } from '@stripe/stripe-js';
import { logConnectionAttempt } from '../utils/stripeMonitor';

interface StripeContextType {
  stripePromise: Promise<Stripe | null>;
}

export const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  stripePromise: Promise<Stripe | null>;
  children: ReactNode;
}

// Global variable to track if we've already logged this browser session
let hasInitializedStripe = false;

export function StripeProvider({ stripePromise, children }: StripeProviderProps) {
  // IMPORTANT: We only run this effect ONCE per browser session, not per component mount/unmount
  useEffect(() => {
    if (!hasInitializedStripe) {
      // Mark as initialized immediately to prevent any race conditions
      hasInitializedStripe = true;
      
      // Log only once per browser session
      console.log('[Stripe] Initializing Stripe context');
      logConnectionAttempt();
      
      // Load Stripe in background but don't do anything with it yet
      stripePromise.then(stripe => {
        if (stripe) {
          console.log('[Stripe] Stripe library loaded successfully');
        } else {
          console.warn('[Stripe] Stripe library failed to load');
        }
      }).catch(err => {
        console.error('[Stripe] Error loading Stripe:', err);
      });
    }
    
    // No cleanup function - we want this to run only once
  }, []); // Empty dependency array - only run on first mount

  return (
    <StripeContext.Provider value={{ stripePromise }}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
} 