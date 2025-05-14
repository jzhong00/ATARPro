// src/services/userService.ts
import { UserProfile } from '../types';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { siteConfig } from './siteConfig';


export const fetchUserProfile = async (
  user: User | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>
): Promise<boolean> => {
  if (!user) {
    setUserProfile(null);
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, stripe_expiry_date, session_code')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      setUserProfile(null);
      return false;
    }

    setUserProfile(data as UserProfile);

    const validateResponse = await fetch(siteConfig.getApiUrl('validate-session-code'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
      credentials: 'include',
    });

    console.log('[fetchUserProfile] validateResponse:', validateResponse);

    const result = await validateResponse.json();
    return result.success === true;
  } catch (err: any) {
    console.error('[fetchUserProfile] EXCEPTION:', err.message);
    setUserProfile(null);
    return false;
  }
};