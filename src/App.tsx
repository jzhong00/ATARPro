import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, lazy, Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { overrideConsoleError } from './utils/logger';
import TimeoutLoading from './components/common/TimeoutLoading';
import { useAuth } from './hooks/useAuth';

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


// Override console errors to toast
overrideConsoleError();
const Loading = () => <TimeoutLoading />;

const AppRoutes = () => {
  const [scalingError] = useState<string | null>(null);
  const { session, userProfile, isLoadingAuth } = useAuth();
  const isLoadingApp = isLoadingAuth;
  if (isLoadingApp) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50">
      {scalingError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Warning</p>
          <p>{scalingError}</p>
        </div>
      )}
      <Routes>
        <Route element={<PublicLayout session={session} />}>
          <Route index element={<LandingPage session={session} />} />
        </Route>

        <Route element={<PublicLayout session={session} hideHeaderAuthButtons={true} />}>
          <Route path="/guest-calculator" element={<SingleStudentCalculator isGuestMode={true} />} />
        </Route>

        <Route path="/auth" element={<Suspense fallback={<Loading />}><AuthPage /></Suspense>} />
        <Route path="/payment-success" element={<Suspense fallback={<Loading />}><PaymentSuccess /></Suspense>} />
        <Route path="/payment-cancel" element={<Suspense fallback={<Loading />}><PaymentCancel /></Suspense>} />

        <Route element={<ProtectedRoute session={session} userProfile={userProfile} isLoading={isLoadingAuth} />}>
          <Route element={<Layout session={session} userProfile={userProfile} isLoadingAuth={isLoadingAuth} />}>
            <Route path="app" element={<Suspense fallback={<Loading />}><FrontPage /></Suspense>} />
            <Route path="student" element={<Suspense fallback={<Loading />}><SingleStudentCalculator /></Suspense>} />
            <Route path="cohort/*" element={<Suspense fallback={<Loading />}><CohortCalculator /></Suspense>} />
            <Route path="scaling-graphs" element={<Suspense fallback={<Loading />}><ScalingGraphs /></Suspense>} />
            <Route path="equivalent" element={<Suspense fallback={<Loading />}><EquivalentCalculator /></Suspense>} />
            <Route path="setplan" element={<Suspense fallback={<Loading />}><SETPlanCalculator /></Suspense>} />
            <Route index element={<Navigate to="/app" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Suspense fallback={<Loading />}><NotFound /></Suspense>} />
      </Routes>
    </div>
  );
};

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