import { NavLink, Link /*, useNavigate*/ } from 'react-router-dom'; // Removed unused useNavigate
import { Session } from '@supabase/supabase-js'; // Import Session type
import { supabase } from '../../services/supabaseClient'; // Import Supabase client for logout
import React, { useState } from 'react'; // Import useState
import { UserProfile } from '../../types'; // Import UserProfile type

// Define props type for Header
interface HeaderProps {
  session: Session | null;
  userProfile?: UserProfile | null; // Add userProfile prop
  showNavLinks?: boolean; // Add optional prop, defaults to true if not provided
  hideAuthButtons?: boolean; // New prop to hide auth buttons
}

const Header: React.FC<HeaderProps> = ({ session, userProfile, showNavLinks = true, hideAuthButtons = false }) => {
  // const navigate = useNavigate(); // Removed unused navigate
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      // Navigation is now handled by onAuthStateChange in App.tsx
      console.log('Logout successful, navigation handled by auth state change.');
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.user?.id) {
      console.error("User not logged in, cannot manage subscription.");
      setError("You must be logged in.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include Authorization header if your API needs it (depends on API implementation)
          // 'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ userId: session.user.id }), // Pass userId
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session.');
      }

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Portal
      } else {
        throw new Error('Portal URL not received.');
      }
    } catch (err: any) {
      console.error('Error creating customer portal session:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { path: '/student', label: 'Single Student Calculator' },
    { path: '/cohort', label: 'Cohort Calculator' },
    { path: '/setplan', label: 'SET Plan Calculator' },
    { path: '/equivalent', label: 'Equivalent Calculator' },
    { path: '/scaling-graphs', label: 'Scaling Graphs' },
  ];

  // Common button styling
  const buttonStyle = "px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const primaryButtonStyle = `${buttonStyle} bg-blue-600 text-white hover:bg-blue-700`;
  const secondaryButtonStyle = `${buttonStyle} bg-gray-200 text-gray-700 hover:bg-gray-300`;

  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Title - Link to /app if nav links shown, / otherwise */}
          <NavLink to={showNavLinks ? "/app" : "/"} className="text-2xl font-bold text-blue-700 hover:text-blue-900">
            ATAR Predictions QLD
          </NavLink>

          {/* Main Navigation Links - Conditionally Rendered */}
          {showNavLinks && (
            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Auth Buttons/User Info - Conditionally render the entire block */}
          {!hideAuthButtons && (
            <div className="flex items-center space-x-3">
              {session ? (
                // User is logged in
                <>
                  {/* Show Go to App button ONLY if logged in AND nav links are hidden (i.e., on LandingPage) */}
                  {!showNavLinks && (
                     <Link to="/app" className={primaryButtonStyle}>
                       Go to App
                     </Link>
                  )}
                  {/* Manage Subscription Button (Conditionally Rendered) */}
                  {showNavLinks && userProfile?.is_subscribed && (
                    <button 
                      onClick={handleManageSubscription} 
                      className={secondaryButtonStyle} 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Manage Subscription'}
                    </button>
                  )}
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {/* Display user email if available */}
                    {session.user?.email}
                  </span>
                  <button onClick={handleLogout} className={secondaryButtonStyle}>
                    Logout
                  </button>
                  {/* Display error message if handleManageSubscription fails */}
                  {error && <p className="text-sm text-red-600 ml-3">Error: {error}</p>}
                </>
              ) : (
                // User is not logged in
                <>
                  <Link to="/guest-calculator" className={secondaryButtonStyle}>
                    Free ATAR Calculator
                  </Link>
                  <Link to="/auth?view=sign_in" className={secondaryButtonStyle}>
                    Login
                  </Link>
                  <Link to="/auth?view=sign_up" className={primaryButtonStyle}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 