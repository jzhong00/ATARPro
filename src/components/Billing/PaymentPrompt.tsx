import React from 'react';
import PaymentButton from './PaymentButton';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient'; // Import supabase client for logout
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface PaymentPromptProps {
  session: Session | null;
}

/**
 * Displays a prompt to the user when their access is restricted (e.g., due to lack of subscription).
 * Shows a message explaining the restriction and provides a PaymentButton component
 * to allow the user to proceed with payment. Also includes a logout button.
 */
const PaymentPrompt: React.FC<PaymentPromptProps> = ({ session }) => {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogout = async () => {
    localStorage.clear();
    await supabase.auth.signOut().catch((err) => {
      console.error('SignOut failed unexpectedly:', err);
      return { error: err };
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="container mx-auto max-w-md p-6 bg-white rounded-xl shadow-md text-center">
        <div className="flex justify-center mb-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:underline text-sm">
            <img
          src="/src/favicons/android-chrome-192x192.png"
          alt="Back"
          className="w-11 h-11 rounded-lg" // 50px is equivalent to 12 Tailwind units
            />
          </button>
        </div>
        <h2 className="text-2xl font-semibold mb-4">Access Restricted</h2>
        <p className="mb-6 text-gray-600">
          Please complete your purchase to access the full features of the ATAR Calculator suite.
        </p>
        <PaymentButton session={session} />
        <button
          onClick={handleLogout}
          className="mt-4 text-sm text-gray-500 hover:underline focus:outline-none">
          Logout
        </button>
      </div>
    </div>
  );
};

export default PaymentPrompt; 