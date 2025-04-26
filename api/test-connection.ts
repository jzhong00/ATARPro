// api/test-connection.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Just return a success response with some basic info
    return res.status(200).json({
      success: true,
      message: 'API connection successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      // Don't include sensitive info like actual keys
      envVars: {
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
        hasStripePrice: !!process.env.STRIPE_PRICE_ID,
        hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL
      }
    });
  } catch (error: any) {
    console.error('Error in test-connection endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in test connection',
      error: error.message
    });
  }
} 