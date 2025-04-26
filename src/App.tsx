// Force new deployment
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import FrontPage from './components/FrontPage';
import SingleStudentCalculator from './components/calculators/SingleStudentCalculator';
import CohortCalculator from './components/calculators/CohortCalculator';
import ScalingGraphs from './components/calculators/ScalingGraphs';
import EquivalentCalculator from './components/calculators/EquivalentCalculator';
import SETPlanCalculator from './components/calculators/SETPlanCalculator';
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import LandingPage from './components/LandingPage';
import { loadScalingData } from './utils/scaling';
import AuthPage from './components/Auth/AuthPage';
import { supabase } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PaymentSuccess from './components/Billing/PaymentSuccess';
import PaymentCancel from './components/Billing/PaymentCancel';
import { UserProfile } from './types';
import { StripeProvider } from './contexts/StripeContext';

// Initialize Stripe once at app startup, outside of any component
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
let stripePromiseInstance: ReturnType<typeof loadStripe> | null = null;

// This function ensures we only create a single Stripe instance
const getStripePromise = (): ReturnType<typeof loadStripe> => {
  if (!stripePromiseInstance) {
    console.log('Creating Stripe instance for the first time');
    if (!stripePublishableKey) {
      console.error('Stripe Publishable Key is missing. Check your .env file');
      stripePromiseInstance = Promise.resolve(null);
    } else {
      // Create the Stripe promise only once
      stripePromiseInstance = loadStripe(stripePublishableKey);
    }
  }
  return stripePromiseInstance;
};

// Use this global stripe promise throughout the app
const stripePromise = getStripePromise();

const fetchUserProfile = async (user: User | null, setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>) => {
  if (!user) {
    setUserProfile(null);
    return;
  }

  try {
    const { data, error, status } = await supabase
      .from('users')
      .select(`id, is_subscribed`)
      .eq('id', user.id)
      .single();

    if (error && status !== 406) {
      console.error('[fetchUserProfile] Error fetching user profile:', error.message);
      setUserProfile(null);
    } else if (data) {
      setUserProfile(data as UserProfile);
    } else {
      setUserProfile(null);
    }
  } catch (error: any) {
    console.error('[fetchUserProfile] EXCEPTION caught:', error.message);
    setUserProfile(null);
  }
};

// New component to hold the core app logic and routing
const AppRoutes = () => {
  const [scalingError, setScalingError] = useState<string | null>(null);
  const authSubscriptionRef = useRef<ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null>(null);

  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const navigate = useNavigate();

  // Effect for loading scaling data
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadScalingData();
      } catch (error) {
        console.error('App: useEffect 1 - Failed to load scaling data:', error);
        setScalingError('Failed to load scaling data. Some features may not work correctly.');
      }
    };
    loadData();
  }, []);

  // Effect for handling authentication and profile fetching (Final Cleaned Version)
  useEffect(() => {
    setIsLoadingAuth(true);

    supabase.auth.getSession().then(({ data: { session: sessionFromGetSession } }) => {
      if (!sessionFromGetSession && session === null) {
          setIsLoadingAuth(false);
      }
    }).catch(error => {
       console.error('[Auth Effect] getSession().catch - Error:', error);
       setIsLoadingAuth(false);
    });

    const listenerTimerId = setTimeout(() => {
      if (!authSubscriptionRef.current) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
          if (_event === 'SIGNED_OUT') {
              setSession(null);
              setUserProfile(null);
              setIsLoadingAuth(false);
              navigate('/');
              return;
          }
    
          if (currentSession && (_event === 'INITIAL_SESSION' || _event === 'SIGNED_IN')) {
               setSession(currentSession);
               
               await fetchUserProfile(currentSession.user, setUserProfile);
               
               setIsLoadingAuth(false);
    
          } else if (!currentSession) {
               setSession(null);
               setUserProfile(null);
               setIsLoadingAuth(false);
    
          } else if (currentSession) {
               setSession(currentSession);
               setIsLoadingAuth(false);
          }
        });
        authSubscriptionRef.current = subscription;
      }
    }, 50);

    return () => {
        clearTimeout(listenerTimerId);

        if (authSubscriptionRef.current) {
            authSubscriptionRef.current.unsubscribe();
            authSubscriptionRef.current = null;
        }
    };

  }, []);

  const isLoadingApp = isLoadingAuth;

  // Loading state for the entire app
  if (isLoadingApp) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-xl">
        Loading application data...
      </div>
    );
  }

  // Stripe key check (can remain here as it's a prerequisite)
  if (!stripePublishableKey) {
    return (
      <div className="min-h-screen bg-red-100 flex flex-col items-center justify-center text-red-800 p-4">
        <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
        <p>The Stripe Publishable Key is missing.</p>
        <p>Please ensure VITE_STRIPE_PUBLISHABLE_KEY is set correctly in your .env file.</p>
        <p className="mt-2 text-sm">The application cannot proceed with payment features.</p>
      </div>
    );
  }

  // Render the actual routes
  return (
    <div className="min-h-screen bg-gray-50">
      {scalingError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Warning</p>
          <p>{scalingError}</p>
        </div>
      )}
      <Routes>
        {/* Public Route for Landing Page (with header buttons) */}
        <Route element={<PublicLayout session={session} />}>
          <Route index element={<LandingPage session={session} />} />
        </Route>

        {/* Public Route for Guest Calculator (without header buttons) */}
        <Route element={<PublicLayout session={session} hideHeaderAuthButtons={true} />}>
          <Route 
            path="/guest-calculator" 
            element={<SingleStudentCalculator isGuestMode={true} />} 
          />
        </Route>

        {/* Other Public Routes (Auth, Payment - without PublicLayout) */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />
        
        {/* Protected Routes */}
        <Route element={(
          <ProtectedRoute
            session={session}
            userProfile={userProfile}
            isLoading={isLoadingAuth}
          />
        )}>
          {/* Apply Layout to all nested protected routes */}
          <Route element={( 
            <Layout 
              session={session}
              userProfile={userProfile}
            /> 
          )}>
            {/* Original root path for layout children is now implicit */}
            {/* Define the main app page route */}
            <Route path="app" element={<FrontPage />} />
            {/* Other protected child routes */}
            <Route path="student" element={<SingleStudentCalculator />} />
            <Route path="cohort/*" element={<CohortCalculator />} />
            <Route path="scaling-graphs" element={<ScalingGraphs />} />
            <Route path="equivalent" element={<EquivalentCalculator />} />
            <Route path="setplan" element={<SETPlanCalculator />} />
            {/* Add index route if needed for `/` within protected layout */}
            <Route index element={<Navigate to="/app" replace />} /> 
          </Route>
        </Route>
      </Routes>
    </div>
  );
};

// The main App component now just sets up the Router
function App() {
  return (
    <StripeProvider stripePromise={stripePromise}>
      <Router>
        <AppRoutes />
      </Router>
    </StripeProvider>
  );
}

export default App; 