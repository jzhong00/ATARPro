import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  // Extract session_id from URL query parameters, could be used for verification later
  const sessionId = new URLSearchParams(location.search).get('session_id');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-green-700 mb-3">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Thank you for your purchase. Your access should be updated shortly (pending webhook confirmation).</p>
        {/* Optionally display the session ID for debugging/confirmation */}
        {sessionId && (
          <p className="text-xs text-gray-400 mt-4 mb-2 break-all">
            Session ID: {sessionId}
          </p>
        )}
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