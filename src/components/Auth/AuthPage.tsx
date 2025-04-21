import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../services/supabaseClient'; // Adjust path if services is elsewhere
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  // Determine initial view from query parameter
  const params = new URLSearchParams(location.search);
  const initialView = params.get('view') === 'sign_up' ? 'sign_up' : 'sign_in';

  useEffect(() => {
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Navigate to the app dashboard *after* successful sign-in
        // Using navigate inside useEffect ensures it runs after component mounts
        // and state updates have likely propagated.
        navigate('/app');
      } else if (event === 'SIGNED_OUT') {
        // Optional: Redirect to home or login page on sign out
        // navigate('/');
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]); // Dependency array includes navigate

  return (
    <div className="container mx-auto max-w-md mt-12 p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Login or Sign Up</h2>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }} // Use Supabase's theme for quick styling
        providers={[]} // Optional: Add social providers like 'google', 'github' etc.
                       // Ensure these are enabled in your Supabase project settings!
        view={initialView} // Set the initial view based on query param
        // redirectTo property is removed; navigation is handled by onAuthStateChange
        // theme="minimal" // Alternative appearance
        socialLayout="horizontal" // Layout for social providers
      />
    </div>
  );
};

export default AuthPage; 