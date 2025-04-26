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

// Keep track of whether we've already logged this session
let hasLoggedInitialization = false;

export function StripeProvider({ stripePromise, children }: StripeProviderProps) {
  // Log Stripe initialization only once per session
  useEffect(() => {
    if (!hasLoggedInitialization) {
      // Log connection attempt
      logConnectionAttempt();
      hasLoggedInitialization = true;
      
      if (process.env.NODE_ENV === 'development') {
        stripePromise.then(stripe => {
          if (stripe) {
            console.log('✅ Stripe initialized successfully');
          }
        });
      }
    }
  }, [stripePromise]);

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