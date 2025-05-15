// src/hooks/useAuth.ts
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { fetchUserProfile } from '../services/userService';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';

/**
 * React hook to manage user authentication state.
 * 
 * It handles:
 *  - Initial session check on mount
 *  - Fetching user profiles on valid sessions
 *  - Redirecting users based on authentication state
 *  - Subscribing to and cleaning up authentication state changes
 * 
 * @returns An object containing:
 *  - session: The current Supabase session
 *  - userProfile: The current user's profile
 *  - isLoadingAuth: A boolean indicating if the authentication state is still loading
 */
export const useAuth = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const authSubscriptionRef = useRef<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
    setIsLoadingAuth(true);

    // Check exisiting session on initial load
    supabase.auth.getSession()
      .then(async ({ data: { session: existingSession } }) => {

        if (existingSession) {
          setSession(existingSession);

          // Fetch and validate user session
          const isValid = await fetchUserProfile(existingSession.user, setUserProfile);

          if (!isValid) {
            // Session invalid, force sign out
            console.warn('[Auth] Invalid session, signing out...');
            await supabase.auth.signOut();
            navigate('/');
            return;
          }
        } else {
          // No session found - reset state
          setSession(null);
          setUserProfile(null);
        }

        setIsLoadingAuth(false);
      })
      .catch(err => {
        console.error('[Auth] getSession error:', err);
        setIsLoadingAuth(false);
      });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {

      (async () => {
        if (_event === 'SIGNED_OUT') {
          // Sign out - reset state and navigate to auth page
          setSession(null);
          setUserProfile(null);
          setIsLoadingAuth(false);
          navigate('/');
          return;
        }

        if (_event === 'SIGNED_IN' && currentSession) {
          // Sign in - set session and stop loading
          setSession(currentSession);
          setIsLoadingAuth(false);
        }

        if (!currentSession) {
          // Fallback if session is lost
          setSession(null);
          setUserProfile(null);
          setIsLoadingAuth(false);
          navigate('/app');
        }
      })();
    });

    authSubscriptionRef.current = subscription;

    return () => {
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, []);
  return { session, userProfile, isLoadingAuth };
};