// api/set-session-code.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// CORS preflight config
export const config = {
  api: {
    bodyParser: true, // allow Vercel to parse JSON body
  },
};

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORIGIN_URL = process.env.ORIGIN_URL || 'http://localhost:5173';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing.');
  throw new Error('Missing Supabase credentials in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * API handler that sets a new session code for a user.
 *  - Generates a new UUID session code and updates the database, and sets it in the cookie.
 *  - Responds with a success message if the update is successful, or an error if it fails.
 * @param req - VercelRequest representing the incoming request
 * @param res - VercelResponse used to send the response
 * @returns Sends a JSON response with success or error message.
 * 
 * @throws 400 Bad Request if user_id is missing
 * @throws 405 Method Not Allowed if the request method is not POST
 * @throws 500 Internal Server Error if the database update fails
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

  // Extract user_id from request body
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id in request body' });
  }

  // Generate a new session code and update the database
  const newSessionCode = uuidv4();
  const { error } = await supabase
    .from('users')
    .update({ session_code: newSessionCode })
    .eq('id', user_id);

  if (error) {
    console.error('Supabase update error:', error);
    return res.status(500).json({ error: 'Failed to update session_code' });
  }

  // Set the new session code in the cookie
  res.setHeader('Set-Cookie', [
    `session_code=${newSessionCode}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
  ]);

  return res.status(200).json({ success: true });
}