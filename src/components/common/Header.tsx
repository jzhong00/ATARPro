import { NavLink, Link /*, useNavigate*/ } from 'react-router-dom'; // Removed unused useNavigate
import { Session } from '@supabase/supabase-js'; // Import Session type
import { supabase } from '../../services/supabaseClient'; // Import Supabase client for logout
import React, { useState, useEffect, useRef } from 'react'; // Import useState, useEffect, useRef
import { UserProfile } from '../../types'; // Import UserProfile type
import { siteConfig } from '../../services/siteConfig'; // Import siteConfig for API URL
import { c } from 'vite/dist/node/types.d-aGj9QkWt';

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

  const handleLogout = async () => {    
        localStorage.clear();
        window.location.reload();
        const { error } = await supabase.auth.signOut().catch((err) => {
          console.error('SignOut failed unexpectedly:', err);
          return { error: err };
        });
    }

  const calculatorItems = [
    { path: '/student', label: 'Single Student Calculator' },
    { path: '/cohort', label: 'Cohort Calculator' },
    { path: '/setplan', label: 'SET Plan Calculator' },
    { path: '/equivalent', label: 'Equivalent Calculator' },
  ];
  
  const otherNavItems = [
    { path: '/scaling-graphs', label: 'Scaling Graphs' },
  ];

  // Common button styling
  const buttonStyle = "px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const primaryButtonStyle = `${buttonStyle} bg-blue-600 text-white hover:bg-blue-700`;
  const secondaryButtonStyle = `${buttonStyle} bg-blue-500 text-white hover:bg-blue-600`;
  const thirdButtonStyle = `${buttonStyle} bg-gray-200 text-gray-600 hover:bg-gray-300`;

  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-[1250px] px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Title - Link to /app if nav links shown, / otherwise */}
            <NavLink
            to={showNavLinks ? "/app" : "/"}
            className="text-2xl font-bold text-blue-600"
            >
              ATAR <span className="text-blue-700">Predictions</span> <span className="text-blue-800">QLD</span>
            </NavLink>

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

                    {/* Show two buttons: Manage Subscription and Logout */}
                    {userProfile?.expires_at && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={manageSubscriptionLoading}
                      className={secondaryButtonStyle}
                    >
                      Manage Subscription
                    </button>
                    )}
                  <button
                  onClick={handleLogout}
                  className={thirdButtonStyle}
                  >
                  Logout
                  </button>
                </>
              ) : (
                // User is not logged in
                <>
                    <Link
                    to="/guest-calculator"
                    className={`${thirdButtonStyle} hidden md:inline-block`}
                    >
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
      
      {/* Secondary Header for Tabs */}
      {showNavLinks && (
        <div className="bg-white border-t border-b border-gray-200">
          <div className="mx-auto max-w-[1250px] px-4 py-2 flex justify-center space-x-4">
            {calculatorItems.map((item) => (
              <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }`
            }
              >
            {item.label}
              </NavLink>
            ))}
            {otherNavItems.map((item) => (
              <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }`
            }
              >
            {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        )}
    </header>
  );
};

export default Header; 

