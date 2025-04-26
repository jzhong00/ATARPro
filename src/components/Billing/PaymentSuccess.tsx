import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Displays a confirmation message to the user after a successful payment.
 * This page is typically the redirect target from Stripe upon successful checkout completion.
 */
const PaymentSuccess: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-green-700 mb-3">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Your purchase is complete! We're processing your access now.</p>
        <Link 
          to="/app" 
          className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess; 