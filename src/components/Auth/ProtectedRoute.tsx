import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import PaymentPrompt from '../Billing/PaymentPrompt';
import { UserProfile } from '../../types';
import type { Stripe } from '@stripe/stripe-js';

interface ProtectedRouteProps {
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  stripePromise: Promise<Stripe | null>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, userProfile, isLoading, stripePromise }) => {
  console.log('ProtectedRoute Check:', { isLoading, session, userProfile });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        Loading Application...
      </div>
    );
  }

  if (!session) {
    console.log('ProtectedRoute: No session, navigating to /auth');
    return <Navigate to="/auth" replace />;
  }

  if (!userProfile || !userProfile.is_subscribed) {
    console.log('ProtectedRoute: Session exists, but userProfile indicates not subscribed. Showing PaymentPrompt.');
    return <PaymentPrompt session={session} stripePromise={stripePromise} />;
  }

  console.log('ProtectedRoute: Session exists and user is subscribed. Rendering Outlet.');
  return <Outlet />;
};

export default ProtectedRoute; 