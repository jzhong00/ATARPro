// api/validate-session-code.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import cookie from 'cookie';

// --- Vercel Configuration --
export const config = {
  api: {
    bodyParser: false,
  },
};

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORIGIN_URL = process.env.ORIGIN_URL || 'http://localhost:5173';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing from environment variables.');
  throw new Error('Server configuration error: Missing Supabase credentials.');
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);


/**
 * API handler that validates the session code for a user.
 * - Checks if the session code in the cookie matches the one in the database.
 * - Responds with a success message if they match, or an error if they don't.
 * @param req - VercelRequest representing the incoming request
 * @param res - VercelResponse used to send the response
 * @returns 200 OK if the session code is valid, 401 Unauthorized if it doesn't match, or 500 Internal Server Error if there's a server error.
 * 
 * @throws 400 Bad Request if user_id or session_code is missing
 * @throws 401 Unauthorized if session codes do not match
 * @throws 404 Not Found if user is not found in the database
 * @throws 405 Method Not Allowed if the request method is not POST
 * 
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  // Note: Access-Control-Allow-Origin must not be set to '*' when credentials are included
  // which are used for cookies.
  res.setHeader('Access-Control-Allow-Origin', ORIGIN_URL);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Extract cookies from request headers and user_id from request body
  const cookies = cookie.parse(req.headers.cookie || '');
  const cookieSessionCode = cookies['session_code'];
  const { user_id } = req.body;


  if (!user_id || !cookieSessionCode) {
    return res.status(400).json({ error: 'Missing user_id or session_code' });
  }

  // Fetch session_code from Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('session_code')
    .eq('id', user_id)
    .single();


  if (error) {
    console.error('[validate-session-code] Supabase error:', error.message);
    return res.status(500).json({ error: 'Supabase query failed' });
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Session code validation
  if (user.session_code !== cookieSessionCode) {
    console.error('Session mismatch: between', user.session_code, "and ", cookieSessionCode);
    return res.status(401).json({ error: 'Session mismatch. Please re-authenticate.' });
  }

  return res.status(200).json({ success: true });
}