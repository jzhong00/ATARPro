import { NavLink, Link /*, useNavigate*/ } from 'react-router-dom'; // Removed unused useNavigate
import { Session } from '@supabase/supabase-js'; // Import Session type
import { supabase } from '../../services/supabaseClient'; // Import Supabase client for logout
import React, { useState, useEffect, useRef } from 'react'; // Import useState, useEffect, useRef
import { UserProfile } from '../../types'; // Import UserProfile type
import { siteConfig } from '../../services/siteConfig'; // Import siteConfig for API URL

// Define props type for Header
interface HeaderProps {
  session: Session | null;
  userProfile?: UserProfile | null; // Add userProfile prop
  showNavLinks?: boolean; // Add optional prop, defaults to true if not provided
  hideAuthButtons?: boolean; // New prop to hide auth buttons
}

const Header: React.FC<HeaderProps> = ({ session, userProfile, showNavLinks = true, hideAuthButtons = false }) => {
  // const navigate = useNavigate(); // Removed unused navigate
  const [manageSubscriptionLoading, setManageSubscriptionLoading] = useState(false);
  const [manageSubscriptionError, setManageSubscriptionError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown container

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsDropdownOpen(false); // Close dropdown on action
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
      setManageSubscriptionError("You must be logged in.");
      return;
    }
    setManageSubscriptionLoading(true);
    setManageSubscriptionError(null);
    // No need to close dropdown here, page will navigate away

    try {
      const response = await fetch(siteConfig.getApiUrl('create-customer-portal-session'), {
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
      setManageSubscriptionError(err.message || 'An unexpected error occurred.');
      // Keep dropdown open to show error ? Or close? Let's keep it open for now.
    } finally {
      setManageSubscriptionLoading(false);
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
                  {/* Restore Go to App button ONLY if logged in AND nav links are hidden (e.g., on LandingPage) */}
                  {!showNavLinks && (
                     <Link to="/app" className={primaryButtonStyle}>
                       Go to App
                     </Link>
                  )}

                  {/* User Dropdown (only shown if nav links ARE visible, usually) */}
                  {showNavLinks && (
                    <div className="relative" ref={dropdownRef}> 
                      {/* Email as dropdown trigger */}
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none flex items-center"
                      >
                        {session.user?.email}
                        {/* Dropdown Arrow Icon */}
                        <svg className={`ml-1 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                          {/* Manage Subscription Item */}
                          {userProfile?.is_subscribed && (
                            <button
                              onClick={handleManageSubscription}
                              disabled={manageSubscriptionLoading}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                              {manageSubscriptionLoading ? 'Loading...' : 'Manage Subscription'}
                            </button>
                          )}
                          {/* Logout Item */}
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Logout
                          </button>
                          {/* Error Message */}
                          {manageSubscriptionError && (
                              <p className="px-4 py-2 text-xs text-red-600">Error: {manageSubscriptionError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* If nav links are hidden (Landing Page), show Logout button directly */}
                  {!showNavLinks && (
                    <button onClick={handleLogout} className={secondaryButtonStyle}>
                      Logout
                    </button>
                  )}
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