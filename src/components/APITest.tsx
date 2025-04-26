import React, { useState } from 'react';
import { siteConfig } from '../services/siteConfig';

const APITest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
      
    } catch (err: any) {
      console.error('API Test Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">API Connection Test</h2>
      
      <div className="mb-4">
        <button 
          onClick={testAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API Connection'}
        </button>
      </div>
      
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
      </div>
    </div>
  );
};

export default APITest; 