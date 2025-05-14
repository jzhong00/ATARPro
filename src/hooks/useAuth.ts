// src/hooks/useAuth.ts
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { fetchUserProfile } from '../services/userService';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';


export const useAuth = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const authSubscriptionRef = useRef<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
    setIsLoadingAuth(true);
    console.log('[Auth] Starting session check');

    supabase.auth.getSession()
      .then(async ({ data: { session: existingSession } }) => {
        console.log('[Auth] getSession result:', existingSession);

        if (existingSession) {
          setSession(existingSession);
          const isValid = await fetchUserProfile(existingSession.user, setUserProfile);
          console.log('[Auth] fetchUserProfile (getSession) returned:', isValid);

          if (!isValid) {
            console.warn('[Auth] Invalid session, signing out...');
            await supabase.auth.signOut();
            navigate('/auth');
            return;
          }
        } else {
          setSession(null);
          setUserProfile(null);
        }

        setIsLoadingAuth(false);
      })
      .catch(err => {
        console.error('[Auth] getSession error:', err);
        setIsLoadingAuth(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log('[Auth] onAuthStateChange:', _event);

      (async () => {
        if (_event === 'SIGNED_OUT') {
          setSession(null);
          setUserProfile(null);
          setIsLoadingAuth(false);
          navigate('/');
          return;
        }

        if (_event === 'SIGNED_IN' && currentSession) {
          setSession(currentSession);
          setIsLoadingAuth(false);
        }

        if (!currentSession) {
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