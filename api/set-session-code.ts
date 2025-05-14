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

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing.');
  throw new Error('Missing Supabase credentials in environment variables.');
}

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
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id in request body' });
  }

  const newSessionCode = uuidv4();
  console.log('Set: New session code:', newSessionCode);

  const { error } = await supabase
    .from('users')
    .update({ session_code: newSessionCode })
    .eq('id', user_id);

  if (error) {
    console.error('Supabase update error:', error);
    return res.status(500).json({ error: 'Failed to update session_code' });
  }

  res.setHeader('Set-Cookie', [
    `session_code=${newSessionCode}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
  ]);

  return res.status(200).json({ success: true });
}