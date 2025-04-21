# New Phase 9: Implement Access Control & Payment Prompt\n\n**Status: Not Started**\n\n**Goal:** Use the fetched user profile state (`has_paid`) to conditionally render either the protected application content or a payment prompt for logged-in users. Tie everything together.\n\n**Prerequisites:**\n*   New Phase 8 Completed (Frontend loads `userProfile` and `loadingProfile` state).\n*   Phase 2 Completed (`ProtectedRoute.tsx` exists).\n*   New Phase 4 Completed (`PaymentButton.tsx` exists).\n\n---\n\n**Tasks:**\n\n1.  **Create Payment Prompt Component**\n    *   Create the file `src/components/Billing/PaymentPrompt.tsx`.\n    *   This component will be shown to logged-in users who haven't paid. It should explain the need for payment and include the `PaymentButton` component created in Phase 4.\n        ```typescript\n        // src/components/Billing/PaymentPrompt.tsx\n        import React from 'react';\n        import PaymentButton from './PaymentButton';\n        import { Session } from '@supabase/supabase-js';\n
        // Assume session is passed down or retrieved from context
        interface PaymentPromptProps {\n          session: Session | null;\n        }\n
        const PaymentPrompt: React.FC<PaymentPromptProps> = ({ session }) => {\n          return (\n            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h2 className="text-2xl font-semibold mb-4">Access Restricted</h2>
                <p className="mb-6 text-gray-600">
                  Please complete your purchase to access the full features of the ATAR Calculator suite.
                </p>
                <PaymentButton session={session} />
                {/* Optionally add a logout button or link back */}
                {/* <button onClick={() => supabase.auth.signOut()} className=\"mt-4 text-sm text-gray-500 hover:underline\">Logout</button> */}
              </div>
            </div>\n          );
        };

        export default PaymentPrompt;\n        ```\n
2.  **Update `ProtectedRoute` Component**\n    *   Modify `src/components/Auth/ProtectedRoute.tsx` to accept `userProfile` and the combined loading state (`isLoading`) as props.\n    *   Update the logic to check for the loading state, then session existence, and finally the `userProfile.has_paid` status.\n        ```typescript\n        // src/components/Auth/ProtectedRoute.tsx
        import React from 'react';
        import { Navigate, Outlet } from 'react-router-dom';
        import { Session } from '@supabase/supabase-js';
        import PaymentPrompt from '../Billing/PaymentPrompt'; // Import the new prompt

        // Re-define or import the UserProfile type
        interface UserProfile {
          id: string;
          has_paid: boolean;
        }

        interface ProtectedRouteProps {
          session: Session | null;
          userProfile: UserProfile | null;
          isLoading: boolean; // Combined loading state (auth + profile + other app data)
        }

        const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, userProfile, isLoading }) => {
          console.log('ProtectedRoute Check:', { isLoading, session, userProfile });

          if (isLoading) {
            // Show a generic loading indicator while session/profile/app data loads
            return (
              <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                Loading Application...
              </div>
            );
          }

          if (!session) {
            // 1. Check if logged in. If not, redirect to login.
            console.log('ProtectedRoute: No session, navigating to /auth');
            return <Navigate to="/auth" replace />;
          }

          // Session exists, now check payment status
          if (!userProfile || !userProfile.has_paid) {
            // 2. Check if profile exists AND user has paid. If not, show payment prompt.
            console.log('ProtectedRoute: Session exists, but userProfile indicates not paid. Showing PaymentPrompt.');
            return <PaymentPrompt session={session} />;
          }

          // 3. User is logged in AND has paid. Render the protected content.
          console.log('ProtectedRoute: Session exists and user has paid. Rendering Outlet.');
          return <Outlet />;
        };

        export default ProtectedRoute;
        ```

3.  **Update Prop Passing in `App.tsx`**\n    *   In `src/App.tsx`, locate the `<Route>` element that uses `ProtectedRoute`.
    *   Update the props being passed to it: use the combined `isLoadingApp` state, and pass the `session` and `userProfile` states.\n        ```typescript\n        // In src/App.tsx, inside the return statement's <Routes>

        // Ensure these are defined earlier in App component:
        // const isLoadingApp = loadingAuth || loadingProfile || !scalingDataLoaded;
        // const [session, setSession] = useState<Session | null>(null);
        // const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

        // ... other imports ...
        import ProtectedRoute from './components/Auth/ProtectedRoute';
        import PaymentPrompt from './components/Billing/PaymentPrompt'; // May not be needed directly here if only used in ProtectedRoute
        import Layout from './components/layout/Layout';
        // ... other component imports ...

        return (
          <Router>
            {/* ... scalingError handling ... */}
            <Routes>
              {/* Public routes */}
              <Route index element={<LandingPage session={session} />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />

              {/* Protected routes wrapper - UPDATE PROPS HERE */}
              <Route element={<ProtectedRoute session={session} userProfile={userProfile} isLoading={isLoadingApp} />}>
                {/* Routes requiring login AND payment */}
                <Route path="/" element={<Layout session={session} /* pass profile if needed */ />}>
                  <Route path="app" element={<FrontPage />} />
                  <Route path="student" element={<SingleStudentCalculator />} />
                  <Route path="cohort/*" element={<CohortCalculator />} />
                  <Route path="scaling-graphs" element={<ScalingGraphs />} />
                  <Route path="equivalent" element={<EquivalentCalculator />} />
                  <Route path="setplan" element={<SETPlanCalculator />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        );
        ```

4.  **Remove Temporary Payment Button**\n    *   Go back to where you temporarily added the `<PaymentButton />` in Phase 4 (e.g., `Layout.tsx` or `FrontPage.tsx`) and remove it. The button is now correctly placed inside the `PaymentPrompt`.

---

**Testing:**

1.  **Start Development Server:**
    *   Run `vercel dev`.
    *   Ensure `stripe listen ...` is also running if you intend to test the full payment flow.
2.  **Test Non-Paid User Access:**
    *   Log in as a user whose `profiles.has_paid` is `false`.
    *   Attempt to navigate to a protected route (e.g., `/app`, `/student`).
    *   **Verify:** Instead of the application content, you should see the `PaymentPrompt` component, showing the "Access Restricted" message and the "Upgrade to Pro" button.
3.  **Test Payment Flow from Prompt:**
    *   While viewing the `PaymentPrompt`, click the "Upgrade to Pro" button.
    *   Complete the payment flow using Stripe test details.
    *   You should be redirected to `/payment-success`.
    *   **Manually navigate back** to a protected route (e.g., `/app`).
    *   **Verify:** Since the webhook (Phase 7) should have updated the database and the profile fetch (Phase 8) should re-run on navigation/refresh (or auth change), you should now see the actual application content (e.g., the `FrontPage` content at `/app`) instead of the `PaymentPrompt`.
        *   *Note: Depending on how profile state refreshing is implemented, a manual page refresh might be required after returning from `/payment-success` for the change to take effect immediately.*
4.  **Test Paid User Access:**
    *   Log out.
    *   Log in as a user whose `profiles.has_paid` is already `true`.
    *   Navigate directly to a protected route (e.g., `/app`, `/student`).
    *   **Verify:** You should see the application content immediately after the initial "Loading Application..." state, without seeing the `PaymentPrompt`.
5.  **Test Logged Out User Access:**
    *   Log out.
    *   Attempt to navigate to a protected route (e.g., `/app`).
    *   **Verify:** You should be redirected to the `/auth` page (login page), as per the logic in `ProtectedRoute`.
6.  **Check Console Logs:**
    *   Monitor the browser console logs for the `ProtectedRoute Check:` messages to understand the component's state and decisions during these tests. 