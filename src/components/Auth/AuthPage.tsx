import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../services/supabaseClient'; // Adjust path if services is elsewhere
import { useNavigate, useLocation } from 'react-router-dom';
import React from 'react';
import { useEffect } from 'react';
import { siteConfig } from '../../services/siteConfig';
import { getInitialAuthView } from '../../utils/authView';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial view from query parameter
  const params = new URLSearchParams(location.search);
  const initialView = getInitialAuthView(location.search);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {

      // Force loading screen 
      document.body.innerHTML = `
      <div class="min-h-screen bg-gray-100 flex items-center justify-center">
        <div class="flex flex-col items-center">
          <div class="loader animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
      </div>
      `;
        
        try {
          const res = await fetch(siteConfig.getApiUrl('set-session-code'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: session.user.id }),
            credentials: 'include',
          });

          if (!res.ok) {
            console.error('[AuthPage] Failed to set session code');
          }
        } catch (err) {
          console.error('[AuthPage] Error setting session code:', err);
        }
        window.location.href = '/app';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="container mx-auto max-w-md p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-center mb-4">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:underline text-sm">
          <img
        src="/favicons/android-chrome-192x192.png"
        alt="Back"
        className="w-11 h-11 rounded-lg" // 50px is equivalent to 12 Tailwind units
          />
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
        {(() => {
          const [authView, setAuthView] = React.useState('Sign In');

          React.useEffect(() => {
          const interval = setInterval(() => {
            const signInElement = document.getElementById('auth-sign-in');
            const signUpElement = document.getElementById('auth-sign-up');

            if (signInElement) {
            setAuthView('Sign In');
            } else if (signUpElement) {
            setAuthView('Sign Up');
            } else {
            setAuthView('Forgot Password');
            }
          }, 100);

          return () => clearInterval(interval); // Cleanup interval on unmount
          }, []);

          return authView;
        })()}
        </h2>
        <Auth
          supabaseClient={supabase}
          appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
          brand: '#1C4ED8',          // Primary color
          brandAccent: '#1C4ED8',    // Hover/active color
          inputBorder: '#e5e7eb',    // Tailwind gray-200
          inputText: '#1f2937',      // Tailwind gray-800
          messageTextDanger: '#dc2626', // Error message text color
          messageBorderDanger: '#f87171', // Error message border color (Tailwind red-400)
          anchorTextColor: '#555' // Link color
            },
            radii: {
          borderRadiusButton: '0.5rem',  // Rounded buttons (e.g., Tailwind rounded-md/lg)
          inputBorderRadius: '0.5rem'
            },
            fonts: {
          bodyFontFamily: 'Inter, sans-serif'
            }
          }
        }
          }}
          view={initialView}
          providers={[]}
          socialLayout="horizontal"
        />
      </div>
    </div>
  );
};

export default AuthPage; 