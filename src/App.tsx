import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { supabase } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { overrideConsoleError } from './utils/logger';
import { UserProfile } from './types';

// Lazy-loaded components
const FrontPage = lazy(() => import('./components/FrontPage'));
const SingleStudentCalculator = lazy(() => import('./components/calculators/SingleStudentCalculator'));
const CohortCalculator = lazy(() => import('./components/calculators/CohortCalculator'));
const ScalingGraphs = lazy(() => import('./components/calculators/ScalingGraphs'));
const EquivalentCalculator = lazy(() => import('./components/calculators/EquivalentCalculator'));
const SETPlanCalculator = lazy(() => import('./components/calculators/SETPlanCalculator'));
const Layout = lazy(() => import('./components/layout/Layout'));
const PublicLayout = lazy(() => import('./components/layout/PublicLayout'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const AuthPage = lazy(() => import('./components/Auth/AuthPage'));
const ProtectedRoute = lazy(() => import('./components/Auth/ProtectedRoute'));
const PaymentSuccess = lazy(() => import('./components/Billing/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./components/Billing/PaymentCancel'));
const NotFound = lazy(() => import('./components/common/NotFound'));

//--------

overrideConsoleError(); // Override console.error to show toast notifications for errors

const fetchUserProfile = async (user: User | null, setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>) => {
  if (!user) {
    setUserProfile(null);
    return;
  }

  try {
    const { data, error, status } = await supabase
      .from('users')
      .select(`id, expires_at`)
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

  // Placeholder Loading component
  const Loading = () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="loader animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
      </div>
  );

  // Loading state for the entire app
  if (isLoadingApp) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="loader animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
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
              isLoadingAuth={isLoadingAuth}
            /> 
            )}>
            {/* Original root path for layout children is now implicit */}
            {/* Define the main app page route */}
            <Route 
              path="app" 
              element={
              <Suspense fallback={<Loading />}>
                <FrontPage />
              </Suspense>
              } 
            />
            {/* Other protected child routes */}
            <Route 
              path="student" 
              element={
              <Suspense fallback={<Loading />}>
                <SingleStudentCalculator />
              </Suspense>
              } 
            />
            <Route 
              path="cohort/*" 
              element={
              <Suspense fallback={<Loading />}>
                <CohortCalculator />
              </Suspense>
              } 
            />
            <Route 
              path="scaling-graphs" 
              element={
              <Suspense fallback={<Loading />}>
                <ScalingGraphs />
              </Suspense>
              } 
            />
            <Route 
              path="equivalent" 
              element={
              <Suspense fallback={<Loading />}>
                <EquivalentCalculator />
              </Suspense>
              } 
            />
            <Route 
              path="setplan" 
              element={
              <Suspense fallback={<Loading />}>
                <SETPlanCalculator />
              </Suspense>
              } 
            />
            {/* Add index route if needed for `/` within protected layout */}
            <Route 
              index 
              element={<Navigate to="/app" replace />} 
            /> 
            </Route>
        </Route>

        <Route
          path="*"
          element={
            <Suspense fallback={<Loading />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
    </div>
  );
};

// The main App component now just sets up the Router
function App() {
  return (
    <Router>
      <ToastContainer
      position="top-center"
      autoClose={10000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      />
      <AppRoutes />
    </Router>
  );
}

export default App; 