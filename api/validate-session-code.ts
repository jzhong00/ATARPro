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

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing from environment variables.');
  throw new Error('Server configuration error: Missing Supabase credentials.');
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const cookieSessionCode = cookies['session_code'];
  const { user_id } = req.body;

  console.log('Validate: Received cookie session code:', cookieSessionCode);

  if (!user_id || !cookieSessionCode) {
    return res.status(400).json({ error: 'Missing user_id or session_code' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('session_code')
    .eq('id', user_id)
    .single();

  console.log('Validate: session_code from DB:', user?.session_code);

  if (error) {
    console.error('[validate-session-code] Supabase error:', error.message);
    return res.status(500).json({ error: 'Supabase query failed' });
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.session_code !== cookieSessionCode) {
    console.error('Session mismatch: between', user.session_code, "and ", cookieSessionCode);
    return res.status(401).json({ error: 'Session mismatch. Please re-authenticate.' });
  }

  return res.status(200).json({ success: true });
}