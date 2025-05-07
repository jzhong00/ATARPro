import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import PaymentPrompt from '../Billing/PaymentPrompt';
import { UserProfile } from '../../types';

interface ProtectedRouteProps {
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean; // Indicates if session/profile data is still loading
}

/**
 * Component to guard routes that require authentication and an active subscription.
 * It checks for loading state, session existence, and user subscription status.
 * - If loading, shows a loading indicator.
 * - If no session, redirects to the authentication page.
 * - If session exists but user is not subscribed, shows the payment prompt.
 * - If session exists and user is subscribed, renders the child routes (Outlet).
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, userProfile, isLoading }) => {

  const isProfileLoading = session && userProfile === null;

  // Show loading indicator while session/profile data is being fetched
  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="loader animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
      </div>
    );
  }

  // If no active session exists, redirect the user to the login page
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  const isSubscriptionExpired = !userProfile?.stripe_expiry_date || new Date(userProfile.stripe_expiry_date) < new Date();

  if (isSubscriptionExpired) {
    return <PaymentPrompt session={session} />;
  }

  // If session exists and user is subscribed, render the intended child route
  return <Outlet />;
};

export default ProtectedRoute; 