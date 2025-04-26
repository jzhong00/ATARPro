import React from 'react';
import PaymentButton from './PaymentButton';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient'; // Import supabase client for logout
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface PaymentPromptProps {
  session: Session | null;
  // Remove stripePromise prop
}

/**
 * Displays a prompt to the user when their access is restricted (e.g., due to lack of subscription).
 * Shows a message explaining the restriction and provides a PaymentButton component
 * to allow the user to proceed with payment. Also includes a logout button.
 */
const PaymentPrompt: React.FC<PaymentPromptProps> = ({ session }) => {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // console.error('Error logging out:', error); // Removed
    } else {
      // Navigate to home page after successful logout
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-semibold mb-4">Access Restricted</h2>
        <p className="mb-6 text-gray-600">
          Please complete your purchase to access the full features of the ATAR Calculator suite.
        </p>
        {/* No longer need to pass stripePromise */}
        <PaymentButton session={session} />
        <button
          onClick={handleLogout}
          className="mt-4 text-sm text-gray-500 hover:underline focus:outline-none"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default PaymentPrompt; 