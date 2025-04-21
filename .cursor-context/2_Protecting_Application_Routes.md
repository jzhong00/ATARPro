**Status: Completed and Tested**

# Phase 2: Protecting Application Routes

This phase ensures that only authenticated users can access the core calculator features of the application.

7.  **Protected Routes:**
    *   Create a new component, `src/components/Auth/ProtectedRoute.tsx`. This component will wrap the routes that require authentication.
    *   Inside `ProtectedRoute.tsx`, get the current user `session` and the `loadingAuth` status (from the state management set up in Phase 1).
    *   If `loadingAuth` is true, display a loading indicator.
    *   If `loadingAuth` is false and a valid `session` exists, render the child components using the `Outlet` component from `react-router-dom`.
    *   If `loadingAuth` is false and no `session` exists, redirect the user to the login page (e.g., `/auth`) using the `Navigate` component from `react-router-dom`.
    *   Example `ProtectedRoute.tsx`:
        ```typescript
        import React from 'react';
        import { Navigate, Outlet } from 'react-router-dom';
        import { Session } from '@supabase/supabase-js';

        interface ProtectedRouteProps {
          session: Session | null;
          loadingAuth: boolean; // Add loading state prop
          // Or use context: const { session, loadingAuth } = useAuth();
        }

        const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, loadingAuth }) => {
          if (loadingAuth) {
            // Show a loading indicator while session is being checked
            return (
              <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                Checking authentication...
              </div>
            );
          }

          if (!session) {
            // User not logged in (and auth check complete), redirect to login page
            return <Navigate to="/auth" replace />;
          }

          // User is logged in (and auth check complete), render the requested route's component
          return <Outlet />;
        };

        export default ProtectedRoute;
        ```
    *   Modify the routing setup in `src/App.tsx`.
        *   Import the `ProtectedRoute` component.
        *   Wrap the routes that need protection within a `<Route>` element that uses `ProtectedRoute` as its `element`.
        *   Pass the `session` and `loadingAuth` states to the `ProtectedRoute`.
    *   Example modification in `App.tsx`'s `Routes` section:
        ```typescript
        // ... other imports
        import ProtectedRoute from './components/Auth/ProtectedRoute';
        import AuthPage from './components/Auth/AuthPage';
        import Layout from './components/layout/Layout';
        import LandingPage from './components/LandingPage';

        function App() {
          // ... session and loadingAuth state management from Phase 1

          // ... scaling data loading etc.

          // Loading state for combined auth/scaling data
          const isLoadingApp = loadingAuth || !scalingDataLoaded;

          if (isLoadingApp) {
             return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading application...</div>;
          }

          return (
            <Router>
              {/* ... other UI elements */}
              <Routes>
                {/* Public routes */}
                <Route index element={<LandingPage session={session} />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Protected routes wrapper */}
                <Route element={<ProtectedRoute session={session} loadingAuth={loadingAuth} />}>
                  {/* Routes requiring login now inherit protection */}
                  {/* Layout itself doesn't need protection, but its children do */}
                  <Route path="/" element={<Layout session={session} />}>
                     {/* Index route within protected layout could be /app */}
                     <Route path="app" element={<FrontPage />} />
                     <Route path="student" element={<SingleStudentCalculator />} />
                     <Route path="cohort/*" element={<CohortCalculator />} />
                     <Route path="scaling-graphs" element={<ScalingGraphs />} />
                     <Route path="equivalent" element={<EquivalentCalculator />} />
                     <Route path="setplan" element={<SETPlanCalculator />} />
                  </Route>
                </Route>
              </Routes>
              {/* ... other UI elements */}
            </Router>
          );
        }
        ```

**(Test Point 2: Unauthenticated users trying to access `/app`, `/student`, `/cohort`, etc., should see the loading indicator briefly, then be automatically redirected to the `/auth` page. Logged-in users should be able to access these routes normally after the initial loading check.)** 