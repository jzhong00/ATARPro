import React, { useState } from 'react';
import { siteConfig } from '../services/siteConfig';
import { useStripe } from '../contexts/StripeContext';
import { supabase } from '../services/supabaseClient';

const APITest: React.FC = () => {
  const { stripePromise } = useStripe();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // Test a simple endpoint first
      const testUrl = siteConfig.getApiUrl('test-connection');
      const response = await fetch(testUrl, {
        method: 'GET'
      });
      
      const text = await response.text();
      setResponse(`Status: ${response.status}\n\nBody: ${text}`);
      
      // Also get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
      } else {
        setCurrentUser("No authenticated user found");
      }
      
    } catch (err: any) {
      console.error('API Test Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  const testStripeAPI = async () => {
    if (!currentUser || currentUser === "No authenticated user found") {
      setError("You need to be logged in to test the Stripe API");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const apiUrl = siteConfig.getApiUrl('create-checkout-session');
      
      // 1. Call the API directly
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser })
      });
      
      // Get the raw response text
      const responseText = await response.text();
      
      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        setResponse(`API Response:\nStatus: ${response.status}\n\nResponse: ${JSON.stringify(responseData, null, 2)}`);
      } catch (e) {
        setResponse(`API Response (non-JSON):\nStatus: ${response.status}\n\nRaw Response:\n${responseText}`);
      }
      
    } catch (err: any) {
      console.error('Stripe API Test Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">API Connection Test</h2>
      
      <div className="flex space-x-4 mb-4">
        <button 
          onClick={testAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API Connection'}
        </button>
        
        <button 
          onClick={testStripeAPI}
          disabled={loading || !currentUser || currentUser === "No authenticated user found"}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Stripe API
        </button>
      </div>
      
      {currentUser && (
        <div className="mb-4 text-sm bg-blue-50 p-2 rounded">
          <span className="font-semibold">Current User ID:</span> {currentUser}
        </div>
      )}
      
      {response && (
        <div className="mb-4">
          <h3 className="font-semibold">Response:</h3>
          <pre className="bg-white p-3 rounded border mt-2 overflow-auto max-h-40 text-sm">{response}</pre>
        </div>
      )}
      
      {error && (
        <div className="text-red-600 p-3 bg-red-100 rounded border border-red-300">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>API Base URL: {siteConfig.baseUrl}</p>
        <p>Test Endpoint: {siteConfig.getApiUrl('test-connection')}</p>
        <p>Stripe Endpoint: {siteConfig.getApiUrl('create-checkout-session')}</p>
      </div>
    </div>
  );
};

export default APITest; 