import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Displays a message to the user indicating that the payment process was not completed.
 * This page is typically shown when the user cancels the Stripe checkout.
 * Provides a link back to the main application.
 */
const PaymentCancel: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="container mx-auto max-w-md p-6 bg-white rounded-xl shadow-md text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-orange-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 className="text-2xl font-bold text-gray-800 mb-5">Checkout Incomplete</h2>
      <p className="text-gray-600 mb-7">It looks like you navigated away from the payment page before completing your purchase. No worries, you haven't been charged.</p>
      <div className="flex justify-center space-x-4">
        <Link
          to="/app" // Assuming /app is the main dashboard or relevant page
          className="inline-block px-12 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-300"
        >
          Return to App
        </Link>
        {/* Optional: Add a button to retry checkout if desired */}
        {/* <button 
          onClick={() => window.history.back()} // Simple browser back might work, or re-trigger checkout
          className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300"
        >
          Try Again
        </button> */}
      </div>
    </div>
  </div>
);

export default PaymentCancel; 